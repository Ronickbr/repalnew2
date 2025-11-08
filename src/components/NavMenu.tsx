import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Beef, Snowflake, ChefHat, Utensils, Package, Wrench, UtensilsCrossed } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { FeaturedProductDisplay } from './FeaturedProductDisplay';
import SmartDropdown from './SmartDropdown';


// Fallback categories para garantir funcionamento mesmo sem dados
const fallbackCategories = [
  {
    id: 1,
    name: 'Açougue',
    slug: 'acougue',
    icon: 'Beef',
    subcategories: [
      { id: 11, name: 'Picadores de Carne', slug: 'picadores-de-carne' },
      { id: 12, name: 'Moedores de Carne', slug: 'moedores-de-carne' },
      { id: 13, name: 'Serras de Carne', slug: 'serras-de-carne' }
    ]
  },
  {
    id: 2,
    name: 'Refrigeração Comercial',
    slug: 'refrigeracao-comercial',
    icon: 'Snowflake',
    subcategories: [
      { id: 21, name: 'Freezers Horizontais', slug: 'freezers-horizontais' },
      { id: 22, name: 'Geladeiras Comerciais', slug: 'geladeiras-comerciais' },
      { id: 23, name: 'Expositores', slug: 'expositores' }
    ]
  },
  {
    id: 3,
    name: 'Padaria e Confeitaria',
    slug: 'padaria-e-confeitaria',
    icon: 'ChefHat',
    subcategories: [
      { id: 31, name: 'Fogões Industriais', slug: 'fogoes-industriais' },
      { id: 32, name: 'Fornos Comerciais', slug: 'fornos-comerciais' },
      { id: 33, name: 'Fritadeiras', slug: 'fritadeiras' }
    ]
  },
  {
    id: 4,
    name: 'Bar e Restaurante',
    slug: 'bar-e-restaurante',
    icon: 'Utensils',
    subcategories: [
      { id: 41, name: 'Máquinas de Café', slug: 'maquinas-de-cafe' },
      { id: 42, name: 'Liquidificadores Comerciais', slug: 'liquidificadores-comerciais' },
      { id: 43, name: 'Processadores de Alimentos', slug: 'processadores-de-alimentos' }
    ]
  },
  {
    id: 5,
    name: 'Utilidades Domesticas',
    slug: 'utilidades-domesticas',
    icon: 'UtensilsCrossed',
    subcategories: [
      { id: 51, name: 'Liquidificadores', slug: 'liquidificadores' },
      { id: 52, name: 'Processadores', slug: 'processadores' },
      { id: 53, name: 'Acessórios', slug: 'acessorios' }
    ]
  },
  {
    id: 6,
    name: 'Mobiliário em Inox',
    slug: 'mobiliario-em-inox',
    icon: 'Package',
    subcategories: [
      { id: 61, name: 'Mesas', slug: 'mesas' },
      { id: 62, name: 'Armários', slug: 'armarios' },
      { id: 63, name: 'Acessórios', slug: 'acessorios' }
    ]
  },
  {
    id: 7,
    name: 'Peças para Refrigeração',
    slug: 'pecas-para-refrigeracao',
    icon: 'Wrench',
    subcategories: [
      { id: 71, name: 'Compressores', slug: 'compressores' },
      { id: 72, name: 'Termostatos', slug: 'termostatos' },
      { id: 73, name: 'Ventiladores', slug: 'ventiladores' }
    ]
  }
];

// Função para obter o nome do ícone baseado no nome da categoria (mais robusto que slug)
const getIconFromName = (name: string): string => {
  const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos e normaliza

  if (normalized.includes('acougue')) return 'Beef';
  if (normalized.includes('bar') || normalized.includes('bares') || normalized.includes('restaurante') || normalized.includes('restaurantes')) return 'Utensils';
  if (normalized.includes('mobiliario') || normalized.includes('inox')) return 'Package';
  if (normalized.includes('padaria') || normalized.includes('confeitaria')) return 'ChefHat';
  if (normalized.includes('pecas') && normalized.includes('refrigeracao')) return 'Wrench';
  if (normalized.includes('refrigeracao comercial')) return 'Snowflake';
  if (normalized.includes('utilidades') || normalized.includes('utensilios') || normalized.includes('domesticas')) return 'UtensilsCrossed';

  return ''; // Default se não encontrar
};

// Icon mapping com ícones específicos para cada categoria
const iconMap: Record<string, React.ComponentType<any>> = {
  Beef: Beef, // Açougue: Cabeça de animal estilizada
  Snowflake: Snowflake, // Refrigeração Comercial: Floco de neve
  ChefHat: ChefHat, // Padaria e Confeitaria: Chapéu de chef
  Utensils: Utensils, // Bar e Restaurante: Hambúrguer (substituído por Utensils)
  Package: Package, // Mobiliário em Inox: Container
  Wrench: Wrench, // Peças para Refrigeração: Chave inglesa
  UtensilsCrossed: UtensilsCrossed // Utilidades Domesticas: Utensílios cruzados (novo ícone)
};

interface NavMenuProps {
  className?: string;
}

const NavMenu: React.FC<NavMenuProps> = ({ className = '' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const location = useLocation();

  // Refs
  const navRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const { data: categoriesData } = useCategories();

  // Processar categorias do banco de dados para criar estrutura com subcategorias
  const processedCategories = useMemo(() => {
    if (!categoriesData) return [];

    // Separar categorias principais (parent_id = null) e subcategorias
    const parentCategories = categoriesData.filter(cat => !cat.parent_id);
    const subcategories = categoriesData.filter(cat => cat.parent_id);

    // Mapear categorias principais com suas subcategorias e adicionar ícone baseado no nome
    return parentCategories.map(parentCat => ({
      ...parentCat,
      icon: getIconFromName(parentCat.name),
      subcategories: subcategories
        .filter(subcat => subcat.parent_id === parentCat.id)
        .map(subcat => ({
          id: subcat.id,
          name: subcat.name,
          slug: subcat.slug
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [categoriesData]);

  // Usar dados processados ou fallback em caso de erro
  const categories = processedCategories.length > 0 ? processedCategories : fallbackCategories;

  // Detecta se está em tela mobile (sem overflow)
  const checkMobile = useCallback(() => {
    // Apenas define mobile quando a tela é pequena
  }, []);

  // Verifica tamanho da tela
  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile, categories]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Trava scroll do body quando menu mobile está aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fecha menus ao mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [location]);

  // Handlers
  const handleDropdownToggle = (categorySlug: string) => {
    setOpenDropdown(openDropdown === categorySlug ? null : categorySlug);
  };

  const handleHamburgerClick = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Navegação por teclado
  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  // Navegação por teclado para lista de subcategorias
  const handleSubcategoryKeyDown = (event: React.KeyboardEvent, index: number, totalItems: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (index + 1) % totalItems;
      const nextElement = document.querySelector(`[data-subcategory-index="${nextIndex}"]`) as HTMLElement;
      nextElement?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = index === 0 ? totalItems - 1 : index - 1;
      const prevElement = document.querySelector(`[data-subcategory-index="${prevIndex}"]`) as HTMLElement;
      prevElement?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpenDropdown(null);
    }
  };

  // Renderização de ícones com estilo vermelho e tamanho aproximado 28x28px
  const renderIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName];
    if (IconComponent) {
      return (
        <IconComponent className="w-7 h-7 text-[#D0021B] group-hover:text-[#FF4D4D] transition-colors duration-200" />
      );
    }
    return (
      <svg className="w-7 h-7 text-[#D0021B] group-hover:text-[#FF4D4D] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 8v5z" />
      </svg>
    );
  };

  // Menu Desktop com layout vertical (ícone acima do texto) e dropdown inteligente
  const renderDesktopMenu = () => (
    <nav ref={navRef} className="hidden md:flex items-center space-x-4">
      {categories.map((category) => (
        <div key={category.id} className="relative">
          <button
            ref={(el) => triggerRefs.current[category.slug] = el}
            className={`group flex flex-col items-center space-y-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
              openDropdown === category.slug
                ? 'text-[#D0021B] bg-red-50'
                : 'text-[#D0021B] hover:text-[#FF4D4D] hover:bg-red-50'
            }`}
            onClick={() => handleDropdownToggle(category.slug)}
            onKeyDown={(e) => handleKeyDown(e, () => handleDropdownToggle(category.slug))}
            aria-expanded={openDropdown === category.slug}
            aria-haspopup="true"
            aria-label={`Menu ${category.name}`}
          >
            {renderIcon(category.icon || '')}
            <span className="text-center whitespace-nowrap">{category.name}</span>
          </button>
          
          <SmartDropdown
            isOpen={openDropdown === category.slug}
            onClose={() => setOpenDropdown(null)}
            triggerElement={triggerRefs.current[category.slug]}
            placement="bottom-start"
            className="w-auto min-w-[400px] max-w-[90vw]"
            maxHeight={400}
            offset={4}
          >
            <div className="grid grid-cols-[1fr_1fr] py-6 overflow-x-hidden">
              {/* Coluna 1: Subcategorias */}
              <div className="px-4">
                <h3 className="font-semibold text-[#D0021B] mb-4">{category.name}</h3>
                <nav 
                  className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-red-300 scrollbar-track-red-50" 
                  role="menu" 
                  aria-label={`Subcategorias de ${category.name}`}
                >
                  {category.subcategories?.map((subcategory, index) => (
                    <Link
                      key={subcategory.id}
                      to={`/categorias/${category.slug}/${subcategory.slug}`}
                      className="block px-3 py-2 text-sm text-[#D0021B] hover:text-[#FF4D4D] hover:bg-red-50 rounded-md transition-colors duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-opacity-50"
                      onClick={() => {
                        setOpenDropdown(null);
                        setIsMobileMenuOpen(false);
                      }}
                      onKeyDown={(e) => handleSubcategoryKeyDown(e, index, category.subcategories?.length || 0)}
                      data-subcategory-index={index}
                      role="menuitem"
                      tabIndex={0}
                      aria-label={`Navegar para ${subcategory.name}`}
                    >
                      {subcategory.name}
                    </Link>
                  ))}
                </nav>
              </div>
              
              {/* Coluna 2: Produtos em Destaque */}
              <div className="px-4">
                <h4 className="font-semibold text-[#D0021B] mb-4">Produtos em Destaque</h4>
                <FeaturedProductDisplay categoryId={category.id} isOpen={true} />
              </div>
            </div>
          </SmartDropdown>
        </div>
      ))}
    </nav>
  );

  // Menu Mobile com tema vermelho consistente
  const renderMobileMenu = () => (
    <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        role="menu"
        aria-label="Menu mobile"
      >
        <div
          className={`absolute right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#D0021B]">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-[#D0021B] hover:text-[#FF4D4D] hover:bg-red-100 transition-colors duration-200"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-1">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/categorias/${category.slug}`}
                  className="flex items-center space-x-3 p-3 text-[#D0021B] hover:text-[#FF4D4D] hover:bg-red-50 rounded-md transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {renderIcon(category.icon || '')}
                  <span className="font-medium">{category.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${className} relative`}>
      {/* Botão Hamburguer */}
      <button
        className="md:hidden p-2 rounded-md text-[#D0021B] hover:text-[#FF4D4D] hover:bg-red-50 transition-all duration-200"
        onClick={handleHamburgerClick}
        onKeyDown={(e) => handleKeyDown(e, handleHamburgerClick)}
        aria-expanded={isMobileMenuOpen}
        aria-label="Abrir menu de navegação"
        aria-controls="mobile-menu"
      >
        <div className="relative w-6 h-6">
          <Menu className={`absolute inset-0 transition-all duration-300 ${
            isMobileMenuOpen ? 'rotate-90 opacity-0 scale-0' : 'rotate-0 opacity-100 scale-100'
          }`} />
          <X className={`absolute inset-0 transition-all duration-300 ${
            isMobileMenuOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-0'
          }`} />
        </div>
      </button>

      {/* Menu Desktop */}
      {renderDesktopMenu()}
      
      {/* Menu Mobile */}
      {renderMobileMenu()}

      {/* CSS para animações será adicionado via Tailwind ou arquivo CSS separado */}
    </div>
  );
};

export default NavMenu;