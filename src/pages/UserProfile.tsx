import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { User, Settings, LogOut, Lock, FileText, Clock, Shield, CreditCard } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      await logout();
      navigate('/');
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

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
                  Olá, {user.name}
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
                  <div className="text-gray-900 font-medium text-lg">{user.name}</div>
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
                <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-red-200 transition-all duration-200 group">
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-2 rounded-md group-hover:bg-red-50 transition-colors">
                      <User className="h-5 w-5 text-gray-600 group-hover:text-red-600" />
                    </div>
                    <span className="ml-3 font-medium text-gray-700 group-hover:text-gray-900">Editar Perfil</span>
                  </div>
                  <div className="text-gray-400 group-hover:text-red-500">→</div>
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-red-200 transition-all duration-200 group">
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
    </div>
  );
};

export default UserProfile;