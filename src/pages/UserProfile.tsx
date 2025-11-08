import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Meu Perfil</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Informações do Usuário */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações Pessoais</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {user.role === 'super_admin' ? 'Administrador' : 'Cliente'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações da Conta */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações da Conta</h2>
                <div className="space-y-3">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200">
                    Editar Perfil
                  </button>
                  <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-200">
                    Alterar Senha
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors duration-200"
                  >
                    Sair da Conta
                  </button>
                </div>
              </div>

              {/* Estatísticas ou Informações Adicionais */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Atividade Recente</h2>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-600 text-sm">
                    Último acesso: {new Date().toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    Status da conta: {user.active ? 'Ativa' : 'Inativa'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Orçamentos (placeholder para futura implementação) */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Meus Orçamentos</h2>
            <div className="bg-gray-50 p-6 rounded-md text-center">
              <p className="text-gray-600 mb-4">Você ainda não tem orçamentos criados.</p>
              <button className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-200">
                Criar Novo Orçamento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;