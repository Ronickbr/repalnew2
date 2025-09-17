import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
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
    // Verificar se há um usuário logado no localStorage
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('admin_user');
        const storedToken = localStorage.getItem('admin_token');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          
          // Verificar se o token ainda é válido
          const { data, error } = await supabase
            .from('admin_users')
            .select('id, email, name, role, active')
            .eq('id', userData.id)
            .eq('active', true)
            .single();
          
          if (data && !error) {
            setUser(data);
          } else {
            // Token inválido ou usuário inativo, limpar dados
            localStorage.removeItem('admin_user');
            localStorage.removeItem('admin_token');
          }
        }
      } catch {
        // Erro já tratado pelo estado
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Buscar usuário pelo email
      const { data: userData, error: userError } = await supabase
        .from('admin_users')
        .select('id, email, password_hash, name, role, active')
        .eq('email', email.toLowerCase())
        .eq('active', true)
        .single();
      
      if (userError || !userData) {
        return { success: false, error: 'Credenciais inválidas' };
      }
      
      // Verificar senha
      // Como estamos armazenando a senha em texto simples por simplicidade
      // Em produção, usar bcrypt para hash da senha
      const isValidPassword = userData.password_hash === password;
      
      if (!isValidPassword) {
        return { success: false, error: 'Credenciais inválidas' };
      }
      
      // Criar dados do usuário sem a senha
      const userDataWithoutPassword = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        active: userData.active
      };
      
      // Gerar token simples (em produção usar JWT)
      const token = btoa(`${userData.id}:${Date.now()}`);
      
      // Salvar no localStorage
      localStorage.setItem('admin_user', JSON.stringify(userDataWithoutPassword));
      localStorage.setItem('admin_token', token);
      
      setUser(userDataWithoutPassword);
      
      return { success: true };
    } catch {
      // Erro já tratado pelo retorno
      return { success: false, error: 'Erro interno do servidor' };
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async (): Promise<void> => {
    try {
      // Limpar dados do localStorage
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_token');
      
      // Limpar estado
      setUser(null);
    } catch {
      // Erro já tratado pelo retorno
    }
  };
  
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default useAuth;