import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { User, Settings, LogOut, Lock, FileText, Clock, Shield, CreditCard, X, UserPlus, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '../hooks/useSiteSettings';

const UserProfile: React.FC = () => {
  const { user, logout, updateProfile, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { siteName } = useSiteSettings();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { success, error } = await updateProfile({ name });
      if (success) {
        toast.success('Perfil atualizado com sucesso!');
        setShowEditProfile(false);
      } else {
        toast.error(error || 'Erro ao atualizar perfil');
      }
    } catch {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (newPassword.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        return;
    }

    setLoading(true);
    try {
      const { success, error } = await updatePassword(newPassword);
      if (success) {
        toast.success('Senha atualizada com sucesso!');
        setShowChangePassword(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(error || 'Erro ao atualizar senha');
      }
    } catch {
      toast.error('Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      await logout();
      navigate('/');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Helmet>
          <title>Minha Conta | {siteName || 'Repal Equipamentos'}</title>
          <meta name="description" content="Acesse sua conta ou cadastre-se para acompanhar pedidos e orçamentos." />
        </Helmet>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Minha Conta</h1>
            <p className="text-lg text-gray-600">
              Acesse sua área exclusiva para gerenciar pedidos, orçamentos e dados pessoais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <LogIn className="h-7 w-7 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Já sou cliente</h2>
              <p className="text-gray-600 text-center mb-8">
                Se você já possui cadastro, faça login para acessar sua conta.
              </p>
              <Link 
                to="/login"
                className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Fazer Login
              </Link>
            </div>

            {/* Register Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <UserPlus className="h-7 w-7 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Criar nova conta</h2>
              <p className="text-gray-600 text-center mb-8">
                Ainda não tem cadastro? Crie sua conta agora, é rápido e fácil.
              </p>
              <Link 
                to="/cadastro"
                className="block w-full bg-white text-red-600 border-2 border-red-600 text-center py-3 px-4 rounded-lg font-medium hover:bg-red-50 transition-colors duration-200"
              >
                Cadastrar-se
              </Link>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-16">
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">
              Vantagens de ter uma conta
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="mx-auto h-12 w-12 text-blue-500 mb-3">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Histórico de Pedidos</h4>
                <p className="text-sm text-gray-500 mt-1">Acompanhe todos os seus orçamentos e pedidos em um só lugar.</p>
              </div>
              <div className="text-center p-4">
                <div className="mx-auto h-12 w-12 text-blue-500 mb-3">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Agilidade</h4>
                <p className="text-sm text-gray-500 mt-1">Realize novos orçamentos mais rapidamente com seus dados salvos.</p>
              </div>
              <div className="text-center p-4">
                <div className="mx-auto h-12 w-12 text-blue-500 mb-3">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Ofertas Exclusivas</h4>
                <p className="text-sm text-gray-500 mt-1">Receba novidades e ofertas especiais preparadas para você.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isNameEmail = user.name === user.email;
  const displayName = isNameEmail ? 'Cliente' : user.name;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section - Consistent with Home Page aesthetics */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                <User className="h-12 w-12 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  Olá, {displayName}
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Gerencie suas informações e acompanhe seus orçamentos.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleLogout}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 shadow-sm"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-red-600" />
                  Dados Pessoais
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nome Completo</label>
                  <div className="text-gray-900 font-medium text-lg">
                    {isNameEmail ? (
                      <span className="text-gray-400 italic">Não informado</span>
                    ) : (
                      user.name
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <div className="text-gray-900 font-medium break-all">{user.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Tipo de Conta</label>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700">
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role === 'super_admin' ? 'Administrador' : 'Cliente'}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    Último acesso: {new Date().toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-red-600" />
                  Configurações
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <button 
                  onClick={() => setShowEditProfile(true)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-red-200 transition-all duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-2 rounded-md group-hover:bg-red-50 transition-colors">
                      <User className="h-5 w-5 text-gray-600 group-hover:text-red-600" />
                    </div>
                    <span className="ml-3 font-medium text-gray-700 group-hover:text-gray-900">Editar Perfil</span>
                  </div>
                  <div className="text-gray-400 group-hover:text-red-500">→</div>
                </button>
                <button 
                  onClick={() => setShowChangePassword(true)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-red-200 transition-all duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-2 rounded-md group-hover:bg-red-50 transition-colors">
                      <Lock className="h-5 w-5 text-gray-600 group-hover:text-red-600" />
                    </div>
                    <span className="ml-3 font-medium text-gray-700 group-hover:text-gray-900">Alterar Senha</span>
                  </div>
                  <div className="text-gray-400 group-hover:text-red-500">→</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Dashboard / Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-red-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status da Conta</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{user.active ? 'Ativa' : 'Inativa'}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Orçamentos</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">0</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Budgets Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-red-600" />
                  Meus Orçamentos
                </h2>
                <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Novo Orçamento
                </button>
              </div>
              
              <div className="p-8 text-center">
                <div className="mx-auto h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Nenhum orçamento encontrado</h3>
                <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                  Você ainda não realizou nenhum orçamento. Navegue pelos produtos e crie sua lista de desejos.
                </p>
                <div className="mt-6">
                  <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Ver Produtos
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Editar Perfil</h3>
              <button onClick={() => setShowEditProfile(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Alterar Senha</h3>
              <button onClick={() => setShowChangePassword(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdatePassword}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;