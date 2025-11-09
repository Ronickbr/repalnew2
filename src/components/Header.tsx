import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  Snowflake,
  Hamburger,
  ChefHat,
  Beef,
  UtensilsCrossed,
  Container,
  Wrench,
  Utensils,
  User,
  List
} from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useAuth } from '../hooks/useAuth';
import SearchBar from './SearchBar';
import { useCategories } from '../hooks/useCategories';
import NavMenu from './NavMenu';
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

  // Carregar categorias do banco de dados
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useCategories();

  // Função para mapear ícones baseado no slug da categoria
  const getCategoryIcon = (slug: string) => {
    const iconMap: { [key: string]: any } = {
      'refrigeracao-comercial': Snowflake,
      'equipamentos-bares-restaurantes': Hamburger,
      'padaria-confeitaria': ChefHat,
      'acougue': Beef,
      'utensilios-utilidades': UtensilsCrossed,
      'mobiliario-inox': Container,
      'pecas-refrigeracao': Wrench
    };
    return iconMap[slug] || Utensils;
  };

  // Dados de fallback para quando há erro de conexão
  const fallbackCategories = [
    {
      id: 'acougue',
      name: 'Açougue',
      icon: Beef,
      subcategories: [
        { id: 'amaciadores-de-carne', name: 'Amaciadores de Carne' },
        { id: 'balancas-para-acougue', name: 'Balanças para Açougue' },
        { id: 'facas-e-utensílios', name: 'Facas e Utensílios' },
        { id: 'moedores-de-carne', name: 'Moedores de Carne' },
        { id: 'serra-fita', name: 'Serra Fita' }
      ]
    },
    {
      id: 'refrigeracao-comercial',
      name: 'Refrigeração Comercial',
      icon: Snowflake,
      subcategories: [
        { id: 'balcoes-refrigerados', name: 'Balcões Refrigerados' },
        { id: 'camaras-frias', name: 'Câmaras Frias' },
        { id: 'freezers-horizontais', name: 'Freezers Horizontais' },
        { id: 'geladeiras-comerciais', name: 'Geladeiras Comerciais' },
        { id: 'vitrines-refrigeradas', name: 'Vitrines Refrigeradas' }
      ]
    },
    {
      id: 'cozinha-industrial',
      name: 'Cozinha Industrial',
      icon: ChefHat,
      subcategories: [
        { id: 'fogoes-industriais', name: 'Fogões Industriais' },
        { id: 'fornos-combinados', name: 'Fornos Combinados' },
        { id: 'fritadeiras', name: 'Fritadeiras' },
        { id: 'grills-e-chapas', name: 'Grills e Chapas' },
        { id: 'panelas-de-pressao', name: 'Panelas de Pressão' }
      ]
    },
    {
      id: 'equipamentos-para-restaurante',
      name: 'Equipamentos para Restaurante',
      icon: Utensils,
      subcategories: [
        { id: 'equipamentos-de-buffet', name: 'Equipamentos de Buffet' },
        { id: 'lava-loucas', name: 'Lava-louças' },
        { id: 'mesas-e-bancadas', name: 'Mesas e Bancadas' },
        { id: 'processadores-de-alimentos', name: 'Processadores de Alimentos' }
      ]
    }
  ];

  // Transformar dados do banco em estrutura hierárquica
  useMemo(() => {
    // Se há erro de conexão, usar dados de fallback
    if (categoriesError || (!categoriesData && !categoriesLoading)) {
      return fallbackCategories;
    }

    if (!categoriesData || categoriesData.length === 0) {
      return [];
    }

    // Separar categorias principais e subcategorias
    const parentCategories = categoriesData.filter(cat => cat.parent_id === null);
    const subcategories = categoriesData.filter(cat => cat.parent_id !== null);

    // Construir estrutura hierárquica
    return parentCategories.map(parentCat => ({
      id: parentCat.slug,
      name: parentCat.name,
      icon: getCategoryIcon(parentCat.slug),
      subcategories: subcategories
        .filter(subCat => subCat.parent_id === parentCat.id)
        .map(subCat => ({
          id: subCat.slug,
          name: subCat.name
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [categoriesData, categoriesError, categoriesLoading]);

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
    <header className="shadow-lg sticky top-0 z-50" style={{backgroundColor: '#8B0000'}}>
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
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
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-4 xl:px-8">
          <div className="py-1 sm:py-1 lg:py-2">
            {/* Novo NavMenu Component */}
            <NavMenu className="flex-1" />
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