import React, { Suspense } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Package, 
  X, 
  BarChart3, 
  Tag, 
  Image, 
  Settings, 
  LogOut, 
  Menu, 
  Home,
  Users,
  Flag,
  MessageSquare,
  Shield,
  ChevronRight,
  Bell,
  Search,
  User
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const navigationItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: BarChart3, 
      path: '/admin',
      description: 'Visão geral do sistema',
      badge: null
    },
    { 
      id: 'products', 
      label: 'Produtos', 
      icon: Package, 
      path: '/admin/products',
      description: 'Gerenciar produtos',
      badge: null
    },
    { 
      id: 'categories', 
      label: 'Categorias', 
      icon: Tag, 
      path: '/admin/categories',
      description: 'Organizar categorias',
      badge: null
    },
    { 
      id: 'brands', 
      label: 'Marcas', 
      icon: Flag, 
      path: '/admin/brands',
      description: 'Gerenciar marcas',
      badge: null
    },
    { 
      id: 'banners', 
      label: 'Banners', 
      icon: Image, 
      path: '/admin/banners',
      description: 'Controle de banners',
      badge: null
    },
    { 
      id: 'leads', 
      label: 'Leads', 
      icon: MessageSquare, 
      path: '/admin/leads',
      description: 'Gerenciar leads',
      badge: '3'
    },
    { 
      id: 'users', 
      label: 'Usuários', 
      icon: Users, 
      path: '/admin/users',
      description: 'Controle de acesso',
      badge: null
    },
    { 
      id: 'settings', 
      label: 'Configurações', 
      icon: Settings, 
      path: '/admin/settings',
      description: 'Configurações do sistema',
      badge: null
    }
  ];

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/admin') return 'dashboard';
    const segments = path.split('/');
    return segments[segments.length - 1] || 'dashboard';
  };

  const activeTab = getActiveTab();

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar busca global
    console.log('Buscando por:', searchQuery);
  };

  const currentPage = navigationItems.find(item => item.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Header da Sidebar */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <Link to="/admin" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-white font-bold text-lg">Admin Panel</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-white hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Navegação */}
        <nav className="mt-6 px-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs opacity-75">{item.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className={`h-4 w-4 transition-transform ${
                      isActive ? 'transform rotate-90 text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
        
        {/* Footer da Sidebar */}
        <div className="border-t border-gray-200 p-4">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'Administrador'}
                </p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:text-red-700 transition-all duration-200 group"
          >
            <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            Sair do Sistema
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Superior */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Lado Esquerdo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-2">
                <Home className="h-5 w-5 text-gray-400" />
                <span className="text-gray-500">/</span>
                <span className="text-gray-900 font-medium">Admin</span>
                <span className="text-gray-500">/</span>
                <span className="text-blue-600 font-medium">
                  {currentPage?.label || 'Dashboard'}
                </span>
              </div>
            </div>
            
            {/* Lado Direito */}
            <div className="flex items-center space-x-4">
              {/* Busca */}
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </form>
              
              {/* Notificações */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </button>
              
              {/* Avatar do Usuário */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo da Página */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {/* Título da Página */}
            {currentPage && (
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <currentPage.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <span>{currentPage.label}</span>
                </h1>
                <p className="text-gray-600 mt-2">{currentPage.description}</p>
              </div>
            )}
            
            {/* Conteúdo com Suspense */}
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            }>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;