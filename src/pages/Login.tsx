import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '../hooks/useSiteSettings';
 

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requires2fa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { canonicalBaseUrl, siteName } = useSiteSettings();
  const rawOrigin = (canonicalBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')).trim();
  const origin = rawOrigin.replace(/\/+$/, '');
  const canonicalHref = origin ? `${origin}/login` : undefined;
  
  // Função auxiliar para determinar o redirecionamento
  const getRedirectPath = React.useCallback((role?: string) => {
    // Se houver uma origem específica no state, priorize-a
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
    if (from) return from;

    // Se for admin ou super_admin, vá para o dashboard
    if (role === 'admin' || role === 'super_admin') {
      return '/admin';
    }

    // Caso contrário, vá para o perfil do usuário
    return '/perfil';
  }, [location.state]);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      const path = getRedirectPath(user.role);
      navigate(path, { replace: true });
    }
  }, [isAuthenticated, user, navigate, getRedirectPath]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, insira um email válido');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await login(email, password);
      if (result.success && result.user) {
        const path = getRedirectPath(result.user.role);
        navigate(path, { replace: true });
      } else {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch {
      setError('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Helmet>
        <title>Login | {siteName || 'Repal Equipamentos'}</title>
        <meta name="description" content="Acesse sua conta da Repal para gerenciar pedidos, perfil e área administrativa." />
        <meta name="robots" content="noindex, nofollow" />
        {canonicalHref && <link rel="canonical" href={canonicalHref} />}
      </Helmet>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <img 
            src="/favicon.png" 
            alt="Logo" 
            className="mx-auto h-16 w-16 mb-4 rounded-full object-cover"
          />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Acesse sua Conta
          </h2>
          <p className="text-gray-600">
            Entre com suas credenciais para continuar
          </p>
        </div>
        
        {/* Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="admin@repal.com.br"
                  disabled={loading}
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Digite sua senha"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            
            
            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  {requires2fa ? 'Verificando...' : 'Entrando...'}
                </>
              ) : (
                requires2fa ? 'Verificar 2FA' : 'Entrar'
              )}
            </button>
          </form>
          

        </div>
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>&copy; 2024 Repal Equipamentos. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
