import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { apiBase } from '../lib/api';

// Flags de ambiente para permitir bypass de autenticação em desenvolvimento
const devAuthBypass = (import.meta.env.VITE_DEV_AUTH_BYPASS === 'true' || (import.meta.env.VITE_DEV_AUTH_BYPASS as any) === true);

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: AdminUser; error?: string; requires2fa?: boolean; tempToken?: string }>;
  verify2fa: (tempToken: string, code: string, email: string, password: string) => Promise<{ success: boolean; user?: AdminUser; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string }) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Mapeia um usuário do Supabase para o tipo AdminUser.
  // O campo 'active' reflete o valor presente em user_metadata (default true).
  const mapUser = useCallback((u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): AdminUser => {
    const meta = (u.user_metadata || {}) as Record<string, any>;
    return {
      id: u.id,
      email: u.email || '',
      name: meta.name || u.email || '',
      role: meta.role || 'editor',
      active: meta.active !== false,
    };
  }, []);

  useEffect(() => {
    if (devAuthBypass) {
      const devUser: AdminUser = { id: 'dev-admin', email: 'dev@local', name: 'Dev Admin', role: 'super_admin', active: true };
      setUser(devUser);
      setLoading(false);
      return;
    }

    // 'active' evita updates de estado após o desmonte do provider.
    let active = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!active) return;
      setUser(session?.user ? mapUser(session.user) : null);
      setLoading(false);
    });

    // Verificação inicial — fonte única de verdade (a subscription já cobre mudanças posteriores)
    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
      if (!active) return;
      const session = res.data?.session;
      setUser(session?.user ? mapUser(session.user) : null);
      setLoading(false);
    })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setLoading(false);
      });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [mapUser]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; user?: AdminUser; error?: string; requires2fa?: boolean; tempToken?: string }> => {
    try {
      setLoading(true);
      if (devAuthBypass) {
        const devUser: AdminUser = { id: 'dev-admin', email: email || 'dev@local', name: 'Dev Admin', role: 'super_admin', active: true };
        setUser(devUser);
        return { success: true, user: devUser };
      }

      // 1) Tentar o backend (autenticação de admin + 2FA). Se indisponível ou o
      //    usuário não for um admin_users, o fluxo continua com o Supabase.
      let backendReachable = false;
      try {
        const resp = await fetch(`${apiBase}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        backendReachable = resp.status !== 404 && resp.status !== 405;
        if (backendReachable) {
          const j = await resp.json().catch(() => ({}));
          if (resp.ok && j.success) {
            if (j.requires2fa && j.tempToken) {
              return { success: false, requires2fa: true, tempToken: j.tempToken };
            }
            // Cookie de admin definido pelo backend; sessão Supabase criada abaixo.
          }
        }
      } catch {
        // Backend indisponível — prossegue com Supabase (comportamento anterior).
      }

      // 2) Sessão do painel/usuário no Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Supabase login error:', error);
        try {
          await supabase.from('activity_logs').insert({
            action: 'login_failed',
            resource_type: 'auth',
            details: JSON.stringify({ email, error: error.message }),
            status: 'error'
          });
        } catch (logErr) {
          console.warn('Falha ao registrar login_failed em activity_logs:', logErr);
        }
        return { success: false, error: error.message || 'Credenciais inválidas' };
      }
      const u = data.user;
      if (!u) return { success: false, error: 'Falha ao obter usuário' };
      const adminUser = mapUser(u);
      setUser(adminUser);

      try {
        await supabase.from('activity_logs').insert({
          user_id: u.id,
          action: 'login',
          resource_type: 'auth',
          details: JSON.stringify({ email: u.email, role: adminUser.role }),
          status: 'success'
        });
      } catch (logErr) {
        console.warn('Falha ao registrar login em activity_logs:', logErr);
      }

      return { success: true, user: adminUser };
    } finally {
      setLoading(false);
    }
  }, [mapUser]);

  const verify2fa = useCallback(async (tempToken: string, code: string, email: string, password: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> => {
    try {
      setLoading(true);
      const resp = await fetch(`${apiBase}/api/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tempToken, code }),
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok || !j.success) {
        return { success: false, error: j.error || 'Código 2FA inválido' };
      }

      // Backend validou o 2FA; estabelecer a sessão do painel no Supabase.
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        return { success: false, error: '2FA validado, mas não foi possível iniciar a sessão. Tente novamente.' };
      }
      const adminUser = mapUser(data.user);
      setUser(adminUser);

      try {
        await supabase.from('activity_logs').insert({
          user_id: data.user.id,
          action: 'login_2fa',
          resource_type: 'auth',
          details: JSON.stringify({ email: data.user.email, role: adminUser.role }),
          status: 'success'
        });
      } catch (logErr) {
        console.warn('Falha ao registrar login_2fa em activity_logs:', logErr);
      }

      return { success: true, user: adminUser };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha na verificação 2FA';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [mapUser]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Falha ao encerrar sessão no Supabase:', e);
    } finally {
      setUser(null);
    }
    // Best-effort: limpar o cookie de sessão admin no backend (se disponível).
    try {
      await fetch(`${apiBase}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // Backend pode não estar disponível; ignorar silenciosamente.
    }
  }, []);

  const updateProfile = useCallback(async (data: { name?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Usuário não autenticado' };

      const updates: { data: { name?: string } } = { data: {} };
      if (data.name) updates.data.name = data.name;

      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      // Update local state
      setUser(prev => prev ? { ...prev, name: data.name || prev.name } : null);

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      return { success: false, error: errorMessage };
    }
  }, [user]);

  const updatePassword = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar senha';
      return { success: false, error: errorMessage };
    }
  }, []);
  
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  // Função simples de permissões baseada no papel do usuário
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;

    // Super admin tem todas as permissões
    if (user.role === 'super_admin') return true;

    // Admin tem permissões administrativas
    if (user.role === 'admin') {
      const adminPermissions = [
        'manage_settings',
        'manage_users',
        'manage_content',
        'view_dashboard'
      ];
      return adminPermissions.includes(permission);
    }

    // Outros papéis podem ter permissões específicas
    if (user.role === 'editor') {
      const editorPermissions = [
        'manage_content',
        'view_dashboard'
      ];
      return editorPermissions.includes(permission);
    }

    return false;
  }, [user]);

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    login,
    verify2fa,
    logout,
    updateProfile,
    updatePassword,
    isAuthenticated,
    isAdmin,
    hasPermission
  }), [user, loading, login, verify2fa, logout, updateProfile, updatePassword, isAuthenticated, isAdmin, hasPermission]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default useAuth;