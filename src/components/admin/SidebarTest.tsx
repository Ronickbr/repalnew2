import React, { useState } from 'react';
import { BarChart3, Package, Tag, Flag, Image, MessageSquare, Users, Settings, Home, User, LogOut, Shield, ChevronRight } from 'lucide-react';

const SidebarTest: React.FC = () => {
  const [itemCount, setItemCount] = useState(8);
  
  const baseItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, description: 'Visão geral do sistema' },
    { id: 'products', label: 'Produtos', icon: Package, description: 'Gerenciar produtos' },
    { id: 'categories', label: 'Categorias', icon: Tag, description: 'Organizar categorias' },
    { id: 'brands', label: 'Marcas', icon: Flag, description: 'Gerenciar marcas' },
    { id: 'banners', label: 'Banners', icon: Image, description: 'Controle de banners' },
    { id: 'leads', label: 'Leads', icon: MessageSquare, description: 'Gerenciar leads', badge: '3' },
    { id: 'users', label: 'Usuários', icon: Users, description: 'Controle de acesso' },
    { id: 'settings', label: 'Configurações', icon: Settings, description: 'Configurações do sistema' },
  ];

  const additionalItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Relatórios detalhados' },
    { id: 'inventory', label: 'Estoque', icon: Package, description: 'Controle de estoque' },
    { id: 'orders', label: 'Pedidos', icon: Tag, description: 'Gerenciar pedidos' },
    { id: 'customers', label: 'Clientes', icon: Users, description: 'Base de clientes' },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, description: 'Relatórios financeiros' },
    { id: 'marketing', label: 'Marketing', icon: MessageSquare, description: 'Campanhas de marketing' },
    { id: 'support', label: 'Suporte', icon: MessageSquare, description: 'Atendimento ao cliente' },
    { id: 'api', label: 'API', icon: Settings, description: 'Integrações API' },
  ];

  const navigationItems = [...baseItems, ...additionalItems.slice(0, Math.max(0, itemCount - baseItems.length))];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teste de Sidebar - Altura Automática</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantidade de itens na sidebar: {itemCount}
        </label>
        <input
          type="range"
          min="3"
          max="16"
          value={itemCount}
          onChange={(e) => setItemCount(parseInt(e.target.value))}
          className="w-full max-w-md"
        />
        <div className="mt-2 text-sm text-gray-500">
          Teste com diferentes quantidades de itens para ver o comportamento do scroll
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar de Teste */}
        <div className="w-64 bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-white font-bold text-lg">Admin Panel</span>
            </div>
          </div>
          
          {/* Container Principal - Altura Automática */}
          <div className="flex flex-col h-auto max-h-screen w-64">
            {/* Navegação com Scroll */}
            <nav className="mt-6 px-4 overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className="w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg text-gray-400 group-hover:text-gray-600">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-medium truncate">{item.label}</p>
                          <p className="text-xs opacity-75 truncate">{item.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {item.badge && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>
            
            {/* Footer */}
            <div className="border-t border-gray-200 p-4 mt-auto">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      admin@example.com
                    </p>
                    <p className="text-xs text-gray-500">Administrador</p>
                  </div>
                </div>
              </div>
              
              <button className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:text-red-700 transition-all duration-200 group">
                <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Sair do Sistema
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo de Teste */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h2 className="text-xl font-semibold mb-4">Observações do Teste</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <p><strong>Altura Automática:</strong> A sidebar ajusta sua altura automaticamente baseada no conteúdo interno</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p><strong>Scroll Vertical:</strong> Quando há muitos itens, aparece scroll apenas na área de navegação</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <p><strong>Largura Fixa:</strong> Mantém largura de 256px (w-64) independentemente do conteúdo</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <p><strong>Independente do Conteúdo Principal:</strong> A altura da sidebar não é afetada pelo tamanho do conteúdo principal</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Simulação de Conteúdo Principal</h3>
            <p className="text-gray-600 mb-4">Este conteúdo representa a área principal do painel administrativo. A sidebar ao lado deve manter seu comportamento independentemente do tamanho deste conteúdo.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarTest;