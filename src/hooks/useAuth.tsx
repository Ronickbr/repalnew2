import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    const checkAuth = async () => {
      if (devAuthBypass) {
        const devUser: AdminUser = { id: 'dev-admin', email: 'dev@local', name: 'Dev Admin', role: 'super_admin', active: true };
        setUser(devUser);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          setUser(null);
        } else {
          const metaRole = (data.user.user_metadata as any)?.role || 'editor';
          const u: AdminUser = {
            id: data.user.id,
            email: data.user.email || '',
            name: (data.user.user_metadata as any)?.name || data.user.email || '',
            role: metaRole,
            active: true
          };
          setUser(u);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        const metaRole = (session.user.user_metadata as any)?.role || 'editor';
        const u: AdminUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: (session.user.user_metadata as any)?.name || session.user.email || '',
          role: metaRole,
          active: true
        };
        setUser(u);
      } else if (!devAuthBypass) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: AdminUser; error?: string; requires2fa?: boolean; tempToken?: string }> => {
    try {
      setLoading(true);
      if (devAuthBypass) {
        const devUser: AdminUser = { id: 'dev-admin', email: email || 'dev@local', name: 'Dev Admin', role: 'super_admin', active: true };
        setUser(devUser);
        return { success: true, user: devUser };
      }
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error('Supabase login error:', error);
          
          // Log failed login attempt (without user_id obviously)
          await supabase.from('activity_logs').insert({
             action: 'login_failed',
             resource_type: 'auth',
             details: { email, error: error.message },
             status: 'error'
          });
          
          return { success: false, error: error.message || 'Credenciais inválidas' };
        }
        const u = data.user;
        if (!u) return { success: false, error: 'Falha ao obter usuário' };
        const metaRole = (u.user_metadata as any)?.role || 'editor';
        const adminUser: AdminUser = { id: u.id, email: u.email || '', name: (u.user_metadata as any)?.name || u.email || '', role: metaRole, active: true };
        
        setUser(adminUser);

        // Log successful login
        await supabase.from('activity_logs').insert({
           user_id: u.id,
           action: 'login',
           resource_type: 'auth',
           details: { email: u.email, role: metaRole },
           status: 'success'
        });

        return { success: true, user: adminUser };
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Falha no login';
        return { success: false, error: errorMessage };
      }
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch {}
  };

  const updateProfile = async (data: { name?: string }): Promise<{ success: boolean; error?: string }> => {
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
  };

  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar senha';
      return { success: false, error: errorMessage };
    }
  };
  
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  // Função simples de permissões baseada no papel do usuário
  const hasPermission = (permission: string): boolean => {
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
  };
  
  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    updatePassword,
    isAuthenticated,
    isAdmin,
    hasPermission
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default useAuth;