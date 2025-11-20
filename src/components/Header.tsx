import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Mail,
  User,
  ShoppingCart
} from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useAuth } from '../hooks/useAuth';
import SearchBar from './SearchBar';
import NavMenu from './NavMenu';
import { useBudget } from '../contexts/BudgetContext';
import SideQuoteList from './SideQuoteList';

const Header: React.FC = () => {
  const { siteName, contactPhone, contactEmail, logoUrl } = useSiteSettings();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { state: budgetState } = useBudget();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSideQuoteList, setShowSideQuoteList] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const defaultLogo = "https://i.imgur.com/rVJiu8W.png";
  const [logoSrc, setLogoSrc] = useState<string>(defaultLogo);

  useEffect(() => {
    const configured = (logoUrl && typeof logoUrl === 'string' && logoUrl.trim()) ? logoUrl.trim() : '';
    setLogoSrc(configured || defaultLogo);
  }, [logoUrl]);


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
    setShowMobileMenu(false);
  }, [navigate]);

  return (
    <>
    <style dangerouslySetInnerHTML={{
      __html: `
        .header-dropdown-container {
          overflow: visible;
        }
        .user-menu-dropdown {
          z-index: 1001 !important;
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          width: 12rem;
          background: white;
          border-radius: 0.375rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
        }
        @media (max-width: 767px) {
          .user-menu-dropdown {
            width: 14rem;
            right: -0.5rem;
          }
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 main-container header-container">
        <div className="flex justify-between items-center py-3 sm:py-3 lg:py-4 header-responsive">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src={logoSrc} 
              alt={siteName || "Repal Equipamentos"} 
              className="h-8 w-auto sm:h-10 md:h-12 lg:h-14 xl:h-16 transition-all duration-300 logo-img logo-responsive"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setLogoSrc(defaultLogo)}
            />
          </Link>

          {/* Search Bar - Visible on all devices */}
            <div className="flex-1 max-w-xs sm:max-w-sm lg:max-w-lg mx-2 sm:mx-3 lg:mx-6 xl:mx-8 search-responsive">
              <SearchBar 
                placeholder="Digite aqui o que você busca"
                className="w-full px-3 py-2 lg:px-4 lg:py-3 pr-10 lg:pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm lg:text-base transition-all duration-300"
                buttonClassName="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-700 transition-colors duration-200"
                iconClassName="h-4 w-4 lg:h-5 lg:w-5"
              />
            </div>

          {/* User and Budget Icons */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
            {/* User Menu with Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={handleUserClick}
                className="p-4 text-white hover:text-gray-200 transition-colors duration-200 active:text-gray-300"
                title={isAuthenticated ? `Olá, ${user?.name}` : "Minha Conta"}
              >
                <User className="h-6 w-6 sm:h-7 lg:h-8" />
              </button>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="user-menu-dropdown">
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
              className="p-4 text-white hover:text-gray-200 transition-colors duration-200 relative active:text-gray-300"
              title="Meu Orçamento"
              onClick={() => setShowSideQuoteList(prev => !prev)}
            >
              <ShoppingCart className="h-6 w-6 sm:h-7 lg:h-8" />
              {/* Badge para mostrar quantidade de itens no orçamento */}
              {budgetState.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-sm sm:text-base rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center font-bold">
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
            <NavMenu />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg font-medium transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Início
                </Link>
                <Link 
                  to="/categorias" 
                  className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg font-medium transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Categorias
                </Link>
                <Link 
                  to="/contato" 
                  className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg font-medium transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Contato
                </Link>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-col space-y-2">
                  {contactPhone && (
                    <a 
                      href={`tel:${contactPhone}`}
                      className="flex items-center space-x-2 text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      <span>{contactPhone}</span>
                    </a>
                  )}
                  {contactEmail && (
                    <a 
                      href={`mailto:${contactEmail}`}
                      className="flex items-center space-x-2 text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      <span>{contactEmail}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
