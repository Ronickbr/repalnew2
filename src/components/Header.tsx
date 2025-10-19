import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Phone, 
  Mail, 
  Snowflake,
  ChefHat,
  Beef,
  Utensils,
  Container,
  Wrench,
  UtensilsCrossed,
  Hamburger
} from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useFeaturedProductByCategory } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import WhatsAppButton from './WhatsAppButton';
import SearchBar from './SearchBar';

// CSS customizado para scrollbar
const customStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  @media (max-width: 640px) {
    .header-mobile {
      font-size: 0.75rem;
    }
  }
  @media (min-width: 641px) and (max-width: 1024px) {
    .header-tablet {
      font-size: 0.875rem;
    }
  }
  @media (min-width: 1025px) {
    .header-desktop {
      font-size: 1rem;
    }
  }
`;

const Header: React.FC = () => {
  const [isMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{[key: string]: 'left' | 'right' | 'center'}>({});
  const { siteName, contactPhone, contactEmail } = useSiteSettings();
  const navigate = useNavigate();

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
      icon: <Beef className="w-5 h-5" />,
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
      icon: <Snowflake className="w-5 h-5" />,
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
      icon: <ChefHat className="w-5 h-5" />,
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
      icon: <Utensils className="w-5 h-5" />,
      subcategories: [
        { id: 'equipamentos-de-buffet', name: 'Equipamentos de Buffet' },
        { id: 'lava-loucas', name: 'Lava-louças' },
        { id: 'mesas-e-bancadas', name: 'Mesas e Bancadas' },
        { id: 'processadores-de-alimentos', name: 'Processadores de Alimentos' }
      ]
    }
  ];

  // Transformar dados do banco em estrutura hierárquica
  const categories = useMemo(() => {
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

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Função para calcular posição do dropdown
  const calculateDropdownPosition = (categoryId: string, buttonElement: HTMLElement) => {
    const containerWidth = window.innerWidth;
    const buttonRect = buttonElement.getBoundingClientRect();
    const buttonCenter = buttonRect.left + buttonRect.width / 2;
    const dropdownWidth = containerWidth >= 1280 ? 600 : containerWidth >= 1024 ? 500 : 450;
    
    // Calcular se o dropdown caberia centralizado
    const leftEdgeIfCentered = buttonCenter - dropdownWidth / 2;
    const rightEdgeIfCentered = buttonCenter + dropdownWidth / 2;
    
    let position: 'left' | 'right' | 'center' = 'center';
    
    // Se sair pela esquerda, alinhar à esquerda
    if (leftEdgeIfCentered < 20) {
      position = 'left';
    }
    // Se sair pela direita, alinhar à direita
    else if (rightEdgeIfCentered > containerWidth - 20) {
      position = 'right';
    }
    
    setDropdownPosition(prev => ({ ...prev, [categoryId]: position }));
  };

  // Função para navegar para categoria usando slugs
  const handleCategoryNavigation = (categorySlug: string, subcategorySlug?: string) => {
    if (subcategorySlug) {
      navigate(`/categorias/${categorySlug}/${subcategorySlug}`);
    } else {
      navigate(`/categorias/${categorySlug}`);
    }
  };



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

          {/* WhatsApp Button */}
          <div className="hidden md:block">
            <WhatsAppButton 
              message="Olá! Gostaria de saber mais sobre os equipamentos da Repal."
              className="bg-green-500 hover:bg-green-600 text-sm lg:text-base px-3 py-2 lg:px-4 lg:py-2 transition-all duration-300"
            />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
              className="text-white hover:text-gray-200 focus:outline-none focus:text-gray-200 p-2 transition-colors duration-200"
              style={{minHeight: '44px', minWidth: '44px'}}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-in slide-in-from-top duration-300">
          <div className="px-3 pt-3 pb-4 space-y-3">
            {/* Mobile Search */}
            <div className="px-1">
              <SearchBar 
                placeholder="Digite aqui o que você busca"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
                style={{minHeight: '44px'}}
                buttonClassName="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-700 transition-colors duration-200"
                buttonStyle={{minHeight: '44px', minWidth: '44px'}}
                iconClassName="h-5 w-5"
                isMobile={true}
              />
            </div>

            <div className="px-1">
              <WhatsAppButton 
                message="Olá! Gostaria de saber mais sobre os equipamentos da Repal."
                className="w-full justify-center bg-green-500 hover:bg-green-600 py-3 text-base transition-all duration-300 min-h-[44px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Categories Section - Positioned above visual effects */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-4 xl:px-8">
          <div className="py-1 sm:py-1 lg:py-2">
            {/* Mobile Categories - Toggle Visibility */}
            <div className={`block sm:hidden transition-all duration-300 ease-in-out overflow-hidden ${
              isMobileCategoriesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="flex flex-col space-y-1">
                {categoriesLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="text-sm text-gray-500">Carregando categorias...</div>
                  </div>
                ) : categories.map((category, index) => {
                  const IconComponent = category.icon;
                  return (
                    <div key={category.id} className="relative dropdown-container">
                      <button
                        className={`flex items-center space-x-3 p-2 text-red-600 hover:text-red-700 hover:bg-white rounded-lg transition-all duration-300 cursor-pointer group w-full min-h-[40px] hover:shadow-md ${
                          index < categories.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                        onClick={(e) => {
                          const newDropdownState = openDropdown === category.id ? null : category.id;
                          if (newDropdownState) {
                            calculateDropdownPosition(category.id, e.currentTarget);
                          }
                          setOpenDropdown(newDropdownState);
                        }}
                      >
                        <IconComponent className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium text-left flex-1">{category.name}</span>
                      </button>
                      
                      {/* Mobile Dropdown Menu */}
                      {openDropdown === category.id && (
                        <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                          <div className="py-2 max-h-80 overflow-y-auto scrollbar-hide">
                            <button
                              onClick={() => { 
                                handleCategoryNavigation(category.id); 
                                setOpenDropdown(null); 
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 font-medium transition-colors duration-200"
                              style={{minHeight: '44px'}}
                            >
                              Ver todos em {category.name}
                            </button>
                            <hr className="my-2" />
                            <div className="space-y-1">
                              {category.subcategories.map((subcategory) => (
                                <button
                                  key={subcategory.id}
                                  onClick={() => { 
                                    handleCategoryNavigation(category.id, subcategory.id); 
                                    setOpenDropdown(null); 
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 transition-all duration-200 min-h-[44px] flex items-center rounded-md mx-2"
                                  style={{width: 'calc(100% - 1rem)'}}
                                >
                                  {subcategory.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tablet and Desktop: Grid layout */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-0.5 sm:gap-0.5 lg:gap-1">
                {categoriesLoading ? (
                  <div className="col-span-full flex items-center justify-center p-4">
                    <div className="text-sm text-gray-500">Carregando categorias...</div>
                  </div>
                ) : categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <div key={category.id} className="relative dropdown-container">
                      <button
                        className="flex flex-col items-center space-y-0.5 p-1 sm:p-1.5 text-red-600 hover:text-red-700 hover:bg-white rounded-lg transition-all duration-300 cursor-pointer group w-full min-h-[45px] sm:min-h-[48px] lg:min-h-[50px] hover:shadow-md"
                        onClick={(e) => {
                          const newDropdownState = openDropdown === category.id ? null : category.id;
                          if (newDropdownState) {
                            calculateDropdownPosition(category.id, e.currentTarget);
                          }
                          setOpenDropdown(newDropdownState);
                        }}
                      >
                        <IconComponent className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                        <span className="text-xs sm:text-xs lg:text-xs font-medium text-center leading-tight px-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">{category.name}</span>
                      </button>
                      
                      {/* Desktop Dropdown Menu - Layout de Duas Colunas */}
                      {openDropdown === category.id && (
                        <div className={`absolute top-full mt-2 w-[450px] lg:w-[500px] xl:w-[600px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 ${
                          dropdownPosition[category.id] === 'left' ? 'left-0' :
                          dropdownPosition[category.id] === 'right' ? 'right-0' :
                          'left-1/2 transform -translate-x-1/2'
                        }`}>
                          <div className="flex">
                            {/* Coluna Esquerda - Subcategorias */}
                            <div className="w-1/2 py-2 border-r border-gray-200">
                              <div className="max-h-96 overflow-y-auto scrollbar-hide">
                                <button
                                  onClick={() => { 
                                    handleCategoryNavigation(category.id); 
                                    setOpenDropdown(null); 
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 font-medium transition-colors duration-200 sticky top-0 bg-white border-b border-gray-100"
                                  style={{minHeight: '44px'}}
                                >
                                  Ver todos em {category.name}
                                </button>
                                <div className="pt-2 space-y-1">
                                  {category.subcategories.map((subcategory) => (
                                    <button
                                      key={subcategory.id}
                                      onClick={() => { 
                                        handleCategoryNavigation(category.id, subcategory.id); 
                                        setOpenDropdown(null); 
                                      }}
                                      className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 transition-all duration-200 min-h-[44px] flex items-center rounded-md mx-2"
                                      style={{width: 'calc(100% - 1rem)'}}
                                    >
                                      {subcategory.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            {/* Coluna Direita - Produto em Destaque */}
                            <FeaturedProductDisplay categoryId={category.id} IconComponent={IconComponent} onClose={() => setOpenDropdown(null)} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    </>
  );
};

// Componente para exibir produto em destaque por categoria
const FeaturedProductDisplay = ({ categoryId, IconComponent, onClose }: {
  categoryId: string;
  IconComponent: React.ComponentType<{ className?: string }>;
  onClose: () => void;
}) => {
  const { data: featuredProduct, isLoading } = useFeaturedProductByCategory(categoryId);

  if (isLoading) {
    return (
      <div className="w-1/2 p-4">
        <div className="bg-gray-50 rounded-lg p-4 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-1/2 p-4">
      {featuredProduct ? (
        <div className="bg-gray-50 rounded-lg p-4 h-full">
          <h4 className="text-sm font-semibold text-gray-800 mb-3" style={{color: '#8B0000'}}>
            Produto em Destaque
          </h4>
          <Link 
            to={`/produto/${featuredProduct.slug || featuredProduct.id}`}
            className="block group"
            onClick={onClose}
          >
            {/* Imagem do Produto */}
            <div className="aspect-square mb-3 bg-white rounded-lg overflow-hidden border border-gray-200 group-hover:shadow-md transition-shadow duration-200">
              {featuredProduct.product_images && featuredProduct.product_images.length > 0 ? (
                <img 
                  src={featuredProduct.product_images[0].image_url} 
                  alt={featuredProduct.product_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400 text-xs">Sem imagem</span>
                </div>
              )}
            </div>
            
            {/* Nome do Produto */}
            <h5 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2 group-hover:text-red-700 transition-colors duration-200">
              {featuredProduct.product_name}
            </h5>
            
            {/* Call to Action */}
            <div className="text-xs font-medium group-hover:underline" style={{color: '#8B0000'}}>
              Ver detalhes →
            </div>
          </Link>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <IconComponent className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-600">
              Produtos em breve
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;