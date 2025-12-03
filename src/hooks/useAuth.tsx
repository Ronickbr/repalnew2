import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiFetch, ensureCsrf, apiBase } from '../lib/api';

// Flags de ambiente para permitir bypass de autenticação em desenvolvimento
const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requires2fa?: boolean; tempToken?: string }>;
  logout: () => Promise<void>;
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
      if (devAuthBypass || !isSupabaseConfigured) {
        const devUser: AdminUser = { id: 'dev-admin', email: 'dev@local', name: 'Dev Admin', role: 'super_admin', active: true };
        setUser(devUser);
        setLoading(false);
        return;
      }
      try {
        const resp = await fetch(`${apiBase}/api/auth/me`, { credentials: 'include' });
        const json = await resp.json();
        if (resp.ok && json.success && json.data) {
          setUser(json.data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; requires2fa?: boolean; tempToken?: string }> => {
    try {
      setLoading(true);
      if (devAuthBypass || !isSupabaseConfigured) {
        // Backend tratará como dev; apenas chama login
        const resp = await fetch(`${apiBase}/api/auth/login`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const json = await resp.json();
        if (!resp.ok || json.success === false) return { success: false, error: json.error || 'Falha no login' };
        const me = await fetch(`${apiBase}/api/auth/me`, { credentials: 'include' }).then(r => r.json());
        if (me?.success && me?.data) setUser(me.data);
        return { success: true, requires2fa: false };
      }
      const resp = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await resp.json();
      if (!resp.ok || json.success === false) return { success: false, error: json.error || 'Credenciais inválidas' };
      if (json.requires2fa) {
        return { success: true, requires2fa: true, tempToken: json.tempToken };
      }
      const me = await fetch(`${apiBase}/api/auth/me`, { credentials: 'include' }).then(r => r.json());
      if (me?.success && me?.data) setUser(me.data);
      await ensureCsrf();
      return { success: true };
    } catch {
      return { success: false, error: 'Erro interno do servidor' };
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async (): Promise<void> => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch {}
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
