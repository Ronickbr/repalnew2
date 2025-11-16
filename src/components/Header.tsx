import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Mail,
  User,
  List
} from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useAuth } from '../hooks/useAuth';
import SearchBar from './SearchBar';
import { useSubcategories } from '../hooks/useSubcategories';
import CategoryNav from './CategoryNav';
import { useBudget } from '../contexts/BudgetContext';
import SideQuoteList from './SideQuoteList';

const Header: React.FC = () => {
  const { siteName, contactPhone, contactEmail } = useSiteSettings();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { state: budgetState } = useBudget();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSideQuoteList, setShowSideQuoteList] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Agora usando useSubcategories diretamente para pegar todas as subcategorias reais

  // Dados de fallback para quando há erro de conexão - usando strings para ícones
  const fallbackCategories = [
    {
      id: 'refrigeracao-comercial',
      name: 'Refrigeração Comercial',
      icon: 'Snowflake',
      subcategories: [
        { id: 'freezers', name: 'Freezers' },
        { id: 'geladeiras', name: 'Geladeiras' },
        { id: 'expositores-frios', name: 'Expositores' }
      ]
    },
    {
      id: 'bar-e-restaurante',
      name: 'Bar e Restaurante',
      icon: 'Utensils',
      subcategories: [
        { id: 'utensilios', name: 'Utensílios' },
        { id: 'equipamentos', name: 'Equipamentos' },
        { id: 'mobiliario', name: 'Mobiliário' }
      ]
    },
    {
      id: 'padaria-e-confeitaria',
      name: 'Padaria e Confeitaria',
      icon: 'ChefHat',
      subcategories: [
        { id: 'fornos', name: 'Fornos' },
        { id: 'utensilios-padaria', name: 'Utensílios' },
        { id: 'expositores', name: 'Expositores' }
      ]
    },
    {
      id: 'acougue',
      name: 'Açougue',
      icon: 'Beef',
      subcategories: [
        { id: 'carnes-bovinas', name: 'Carnes Bovinas' },
        { id: 'carnes-suinas', name: 'Carnes Suínas' },
        { id: 'aves', name: 'Aves' }
      ]
    },
    {
      id: 'utilidades-domesticas',
      name: 'Utilidades Domésticas',
      icon: 'UtensilsCrossed',
      subcategories: [
        { id: 'panelas', name: 'Panelas' },
        { id: 'talheres', name: 'Talheres' },
        { id: 'acessorios', name: 'Acessórios' }
      ]
    },
    {
      id: 'mobiliario-em-inox',
      name: 'Mobiliário em Inox',
      icon: 'Package',
      subcategories: [
        { id: 'bancadas', name: 'Bancadas' },
        { id: 'armarios', name: 'Armários' },
        { id: 'prateleiras', name: 'Prateleiras' }
      ]
    }
  ];

  // Buscar subcategorias do banco de dados diretamente
  const { data: categoriesWithSubcategoriesFromDB, isLoading: subcategoriesLoading, error: subcategoriesError } = useSubcategories()
  
  // Transformar dados do banco em estrutura hierárquica
  const categoriesWithSubcategories = useMemo(() => {
    // Se está carregando, usar fallback
    if (subcategoriesLoading) {
      return fallbackCategories;
    }
    
    // Se há erro, usar fallback
    if (subcategoriesError) {
      return fallbackCategories;
    }
    
    // Se não há dados do banco, usar fallback
    if (!categoriesWithSubcategoriesFromDB || categoriesWithSubcategoriesFromDB.length === 0) {
      return fallbackCategories;
    }

    // Converter para o formato esperado pelo CategoryNav
    const result = categoriesWithSubcategoriesFromDB.map((cat: any) => {
      // Mapear ícone baseado no slug (usar string, não componente)
      let iconName = 'Package';
      if (cat.slug === 'refrigeracao-comercial') iconName = 'Snowflake';
      else if (cat.slug === 'bar-restaurante') iconName = 'Utensils';
      else if (cat.slug === 'padaria-confeitaria') iconName = 'ChefHat';
      else if (cat.slug === 'acougue') iconName = 'Beef';
      else if (cat.slug === 'utilidades-domesticas') iconName = 'UtensilsCrossed';
      else if (cat.slug === 'mobiliario-inox') iconName = 'Wrench';
      
      return {
        id: cat.slug,
        name: cat.name,
        icon: iconName,
        subcategories: cat.subcategories.map((sub: any) => ({
          id: sub.slug,
          name: sub.name
        }))
      };
    });

    return result;
  }, [categoriesWithSubcategoriesFromDB, subcategoriesLoading, subcategoriesError]);

  const customStyles = `
    @media (max-width: 767px) {
      .text-responsive {
        font-size: 14px;
      }
    }
    @media (min-width: 768px) and (max-width: 1023px) {
      .text-responsive {
        font-size: 15px;
      }
    }
    @media (min-width: 1024px) {
      .text-responsive {
        font-size: 16px;
      }
    }
    
    /* Garantir que o dropdown fique contido nos limites do site */
    .category-nav-container {
      position: relative;
      overflow: visible;
    }
    
    .category-dropdown-wrapper {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      display: flex;
      justify-content: flex-start; /* Alinhar à esquerda por padrão */
      pointer-events: none;
      /* Limites visuais para debug */
      /* border: 2px dashed red; */
      /* background: rgba(255,0,0,0.1); */
    }
    
    .category-dropdown-wrapper > * {
      pointer-events: auto;
      /* Limites visuais do dropdown */
      /* border: 2px solid blue; */
    }
    
    @media (max-width: 767px) {
      .category-dropdown-wrapper {
        left: 0.5rem;
        right: 0.5rem;
        justify-content: center; /* Centralizar em telas pequenas */
      }
    }
    
    @media (max-width: 390px) {
      .category-dropdown-wrapper {
        left: 0.25rem;
        right: 0.25rem;
      }
    }
    
    /* Prevenir scroll horizontal no body quando dropdown está aberto */
    body:has(.category-dropdown-wrapper > *) {
      overflow-x: hidden;
    }
    
    /* Container principal com limites claros */
    .main-container {
      /* Limites visuais para debug - descomente para ver */
      /* box-shadow: inset 0 0 0 2px #00ff00; */
      /* background: rgba(0,255,0,0.05); */
    }
  `;

  // Funções de navegação e autenticação
  const handleUserClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
    } else {
      setShowUserMenu(!showUserMenu);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      await logout();
      setShowUserMenu(false);
      navigate('/');
    }
  };

  const goToAdmin = () => {
    navigate('/admin');
    setShowUserMenu(false);
  };

  const goToProfile = () => {
    navigate('/perfil');
    setShowUserMenu(false);
  };

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fechar menu ao mudar de rota
  useEffect(() => {
    setShowUserMenu(false);
  }, [navigate]);

  return (
    <>
    <style>{customStyles}</style>
    <style dangerouslySetInnerHTML={{
      __html: `
        .header-dropdown-container {
          overflow: visible !important;
        }
        .header-dropdown-container * {
          overflow: visible !important;
        }
      `
    }} />
    <header className="shadow-lg sticky top-0 z-[1000] header-dropdown-container" style={{backgroundColor: '#8B0000'}}>
      {/* Top Bar - Hidden on mobile */}
      <div className="hidden md:block bg-white text-red-900 py-1 sm:py-2">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {contactPhone && (
                <div className="flex items-center space-x-1">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{contactPhone}</span>
                  <span className="sm:hidden">{contactPhone.slice(-9)}</span>
                </div>
              )}
              {contactEmail && (
                <div className="flex items-center space-x-1">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden lg:inline">{contactEmail}</span>
                </div>
              )}
            </div>
            <div className="hidden lg:block">
              <span>Transforme sua cozinha em uma verdadeira potência gastronômica</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 main-container">
        <div className="flex justify-between items-center py-2 sm:py-3 lg:py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src="https://i.imgur.com/rVJiu8W.png" 
              alt={siteName} 
              className="h-10 w-auto sm:h-12 md:h-14 lg:h-16 transition-all duration-300"
            />
          </Link>

          {/* Search Bar - Visible on mobile */}
            <div className="flex-1 max-w-sm lg:max-w-lg mx-2 sm:mx-4 lg:mx-8">
              <SearchBar 
                placeholder="Digite aqui o que você busca"
                className="w-full px-3 py-2 lg:px-4 lg:py-3 pr-10 lg:pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm lg:text-base transition-all duration-300"
                buttonClassName="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-700 transition-colors duration-200"
                iconClassName="h-4 w-4 lg:h-5 lg:w-5"
              />
            </div>

          {/* User and Budget Icons */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {/* User Menu with Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={handleUserClick}
                className="p-2 text-white hover:text-gray-200 transition-colors duration-200"
                title={isAuthenticated ? `Olá, ${user?.name}` : "Minha Conta"}
              >
                <User className="h-5 w-5 lg:h-6 lg:w-6" />
              </button>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                    Olá, {user?.name || 'Usuário'}
                  </div>
                  
                  {isAdmin ? (
                    <>
                      <button
                        onClick={goToAdmin}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                      >
                        Painel Administrativo
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={goToProfile}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                      >
                        Meu Perfil
                      </button>
                    </>
                  )}
                  
                  <div className="border-t border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              className="p-2 text-white hover:text-gray-200 transition-colors duration-200 relative"
              title="Meu Orçamento"
              onClick={() => setShowSideQuoteList(true)}
            >
              <List className="h-5 w-5 lg:h-6 lg:w-6" />
              {/* Badge para mostrar quantidade de itens no orçamento */}
              {budgetState.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {budgetState.totalItems > 99 ? '99+' : budgetState.totalItems}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Categories Section - Positioned above visual effects */}
      <div className="bg-gray-50 border-b border-gray-200 relative z-50 overflow-visible category-nav-container">
        <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-4 xl:px-8">
          <div className="py-1 sm:py-1 lg:py-2 min-h-[60px] relative">
            {/* Novo CategoryNav Component */}
            <CategoryNav className="flex-1" categories={categoriesWithSubcategories} />
          </div>
        </div>
      </div>
    </header>
    
    {/* Side Quote List */}
    <SideQuoteList 
      isOpen={showSideQuoteList}
      onClose={() => setShowSideQuoteList(false)}
    />
    </>
  );
};

export default Header;