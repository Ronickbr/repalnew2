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
  User,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { table } from '../lib/schema';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [newLeadsCount, setNewLeadsCount] = React.useState(0);

  React.useEffect(() => {
    const fetchNewLeadsCount = async () => {
      // Use RPC to avoid 'leads' keyword in URL (AdBlock workaround)
      const { data, error } = await supabase.rpc('get_new_contacts_count');
      
      if (!error && typeof data === 'number') {
        setNewLeadsCount(data);
      } else {
        // Fallback to direct query if RPC fails (or for development)
        const { count, error: countError } = await supabase
          .from(table('leads'))
          .select('*', { count: 'exact', head: true })
          .eq('status', 'novo');
          
        if (!countError && count !== null) {
          setNewLeadsCount(count);
        }
      }
    };

    fetchNewLeadsCount();
    
    // Subscribe to changes
    const subscription = supabase
      .channel('leads_count_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: table('leads') }, 
        () => {
          fetchNewLeadsCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      id: 'adjustments', 
      label: 'Reajustes', 
      icon: DollarSign, 
      path: '/admin/products/adjustments',
      description: 'Reajuste em massa',
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
      id: 'promotions', 
      label: 'Promoções', 
      icon: Tag, 
      path: '/admin/promotions',
      description: 'Gerenciar promoções',
      badge: null
    },
    { 
      id: 'leads', 
      label: 'Leads', 
      icon: MessageSquare, 
      path: '/admin/leads',
      description: 'Gerenciar leads',
      badge: newLeadsCount > 0 ? newLeadsCount.toString() : null
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
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <Link to="/admin" className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <span className="text-white font-bold text-base sm:text-lg">Admin Panel</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 sm:p-2 rounded-md text-white hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        
        {/* Container Principal da Sidebar - Altura Automática */}
        <div className="flex flex-col h-auto max-h-screen w-64">
          {/* Navegação com Scroll */}
          <nav className="mt-6 px-4 overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
          <div className="border-t border-gray-200 p-3 sm:p-4 mt-auto">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'Administrador'}
                </p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
            </div>
          </div>
          
          {/* Link para voltar ao site */}
          <Link
            to="/"
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:text-green-700 transition-all duration-200 group mb-2"
          >
            <Home className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            Voltar ao Site
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:text-red-700 transition-all duration-200 group"
          >
            <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            Sair do Sistema
          </button>
        </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Superior */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            {/* Lado Esquerdo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1 sm:p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Home className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <span className="text-gray-500 text-sm sm:text-base">/</span>
                <span className="text-gray-900 font-medium text-sm sm:text-base">Admin</span>
                <span className="text-gray-500 text-sm sm:text-base">/</span>
                <span className="text-blue-600 font-medium text-sm sm:text-base">
                  {currentPage?.label || 'Dashboard'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo da Página */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6">
            {/* Título da Página */}
            {currentPage && (
              <div className="mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1 sm:p-2 bg-blue-100 rounded-lg">
                    <currentPage.icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <span>{currentPage.label}</span>
                </h1>
                <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">{currentPage.description}</p>
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