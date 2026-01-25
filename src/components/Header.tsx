import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Mail,
  User,
  ShoppingCart,
  Menu
} from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useAuth } from '../hooks/useAuth';
import SearchBar from './SearchBar';
import NavMenu, { MobileMenuDrawer } from './NavMenu';
import { useBudget } from '../contexts/BudgetContext';
import SideQuoteList from './SideQuoteList';

const Header: React.FC = () => {
  const { siteName, contactPhone, contactEmail, logoUrl } = useSiteSettings();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { state: budgetState } = useBudget();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSideQuoteList, setShowSideQuoteList] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const defaultLogo = "https://i.imgur.com/rVJiu8W.png";
  const [logoSrc, setLogoSrc] = useState<string>(defaultLogo);

  useEffect(() => {
    const configured = (logoUrl && typeof logoUrl === 'string' && logoUrl.trim()) ? logoUrl.trim() : '';
    setLogoSrc(configured || defaultLogo);
  }, [logoUrl]);


  // Funções de navegação e autenticação


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
    setIsMobileMenuOpen(false);
  }, [navigate]);

  return (
    <>
    <header className="shadow-lg sticky top-0 z-[1000] overflow-visible bg-primary">
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 main-container header-container">
        <div className="flex justify-between items-center h-[60px] sm:h-[72px] lg:h-auto header-responsive gap-2">
          
          <div className="flex items-center gap-1 sm:gap-4">
            {/* Hamburger Menu - Mobile */}
            <button
              className="lg:hidden min-w-[48px] min-h-[48px] flex items-center justify-center -ml-3 text-white hover:text-gray-200 transition-colors active:bg-white/10 rounded-full"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Menu"
            >
              <Menu className="h-7 w-7" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 ml-1">
              <img 
                src={logoSrc} 
                alt={siteName || "Repal Equipamentos"} 
                className="h-9 w-auto sm:h-10 md:h-12 lg:h-14 xl:h-16 transition-all duration-300 logo-img logo-responsive"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setLogoSrc(defaultLogo)}
              />
            </Link>
          </div>

          {/* Search Bar - Desktop */}
            <div className="hidden lg:block flex-1 max-w-lg mx-6 xl:mx-8 search-responsive">
              <SearchBar 
                placeholder="Digite aqui o que você busca"
                className="w-full px-3 py-2 lg:px-4 lg:py-3 pr-10 lg:pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm lg:text-base transition-all duration-300"
                buttonClassName="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-700 transition-colors duration-200"
                iconClassName="h-4 w-4 lg:h-5 lg:w-5"
              />
            </div>

          {/* User and Budget Icons */}
          <div className="flex items-center space-x-0 sm:space-x-2 lg:space-x-4">
            {/* User Menu with Dropdown */}
            <div className="relative" ref={userMenuRef}>
              {isAuthenticated ? (
                <>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-2 text-white hover:text-gray-200 transition-colors duration-200 active:bg-white/10 rounded-lg"
                    title={`Olá, ${user?.name}`}
                  >
                    <User className="h-6 w-6 sm:h-7 lg:h-8" />
                    <span className="hidden lg:inline text-[10px] sm:text-xs font-medium mt-0.5">Minha conta</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute top-full -right-2 md:right-0 mt-2 w-56 md:w-48 bg-white rounded-md shadow-lg border border-gray-200 z-[1001]">
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
                      )
                    }
                      
                      <div className="border-t border-gray-200">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-primary hover:bg-red-50 transition-colors duration-150"
                        >
                          Sair
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] text-white active:bg-white/10 rounded-lg">
                  <Link to="/minha-conta" className="flex flex-col items-center justify-center w-full h-full p-2">
                    <User className="h-6 w-6 sm:h-7 lg:h-8" />
                    <span className="hidden lg:inline text-[10px] sm:text-xs font-medium mt-0.5">Minha Conta</span>
                  </Link>
                </div>
              )}
            </div>
            
            <button 
              className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-2 text-white hover:text-gray-200 transition-colors duration-200 active:bg-white/10 rounded-lg"
              title="Meu Orçamento"
              onClick={() => setShowSideQuoteList(prev => !prev)}
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6 sm:h-7 lg:h-8" />
                {/* Badge para mostrar quantidade de itens no orçamento */}
                {budgetState.totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[10px] sm:text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-primary">
                    {budgetState.totalItems > 99 ? '99+' : budgetState.totalItems}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline text-[10px] sm:text-xs font-medium mt-0.5">Minha Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories Section - Desktop Only */}
      <div className="hidden lg:block bg-gray-50 border-b border-gray-200 relative z-50 overflow-visible category-nav-container">
        <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-4 xl:px-8">
          <div className="py-1 sm:py-1 lg:py-2 min-h-[60px] relative">
            <NavMenu />
          </div>
        </div>
      </div>

      <MobileMenuDrawer 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenBudget={() => setShowSideQuoteList(true)}
      />
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
