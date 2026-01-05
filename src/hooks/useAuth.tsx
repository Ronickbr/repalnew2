import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
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
      } catch (e: any) {
        return { success: false, error: String(e?.message || 'Falha no login') };
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
