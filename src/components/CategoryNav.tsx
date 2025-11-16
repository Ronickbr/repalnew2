import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useFeaturedProductsByCategory } from '../hooks/useProducts'
import { ChevronDown, Package, Utensils, Snowflake, ChefHat, Beef, UtensilsCrossed } from 'lucide-react'

// Hook simples e eficaz para scroll isolado
const useIsolatedScroll = (ref: React.RefObject<HTMLElement>, isEnabled: boolean) => {
  useEffect(() => {
    if (!isEnabled || !ref.current) return

    const element = ref.current

    const handleWheel = (e: WheelEvent) => {
      // Verificar se temos espaço para scroll
      const hasScroll = element.scrollHeight > element.clientHeight
      if (!hasScroll) return

      // Calcular limites
      const isAtTop = element.scrollTop === 0
      const isAtBottom = element.scrollTop >= element.scrollHeight - element.clientHeight - 1
      const goingUp = e.deltaY < 0
      const goingDown = e.deltaY > 0

      // Prevenir scroll da página se estivermos nos limites
      if ((isAtTop && goingUp) || (isAtBottom && goingDown)) {
        e.preventDefault()
        return
      }

      // Scroll dentro do container
      e.preventDefault()
      e.stopPropagation()
      element.scrollTop += e.deltaY
    }

    element.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      element.removeEventListener('wheel', handleWheel)
    }
  }, [isEnabled, ref])
}

// Estilos otimizados
const styles = `
  .nav-dropdown {
    animation: dropdownFade 0.2s ease-out;
  }
  
  @keyframes dropdownFade {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .subcategory-link {
    transition: all 0.15s ease;
  }
  
  .subcategory-link:hover {
    background: linear-gradient(135deg, #fff7ed, #fed7aa);
    transform: translateX(4px);
  }
  
  .product-card {
    transition: all 0.3s ease;
  }
  
  .product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
  
  .scrollbar-custom {
    scrollbar-width: thin;
    scrollbar-color: #dc2626 #f1f1f1;
  }
  
  .scrollbar-custom::-webkit-scrollbar {
    width: 6px;
  }
  
  .scrollbar-custom::-webkit-scrollbar-thumb {
    background-color: #dc2626;
    border-radius: 3px;
  }
  
  /* Prevenir scroll da página quando dropdown está aberto */
  body.dropdown-open {
    overflow: hidden !important;
    position: fixed !important;
    width: 100% !important;
  }
  
  /* Container de scroll com altura máxima fixa */
  .scroll-container {
    overscroll-behavior: contain !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: smooth !important;
    max-height: 256px !important;
    overflow-y: auto !important;
    position: relative !important;
    pointer-events: auto !important;
  }
  
  /* Garantir que o scroll funcione corretamente */
  .scroll-container::-webkit-scrollbar {
    width: 6px !important;
  }
  
  .scroll-container::-webkit-scrollbar-track {
    background: #f1f1f1 !important;
    border-radius: 3px !important;
  }
  
  .scroll-container::-webkit-scrollbar-thumb {
    background-color: #dc2626 !important;
    border-radius: 3px !important;
  }
`

interface Subcategory {
  id: string | number
  name: string
}

interface Category {
  id: string | number
  name: string
  icon?: string
  subcategories?: Subcategory[]
}

interface CategoryNavProps {
  categories?: Category[]
  className?: string
}

// Mapeamento de ícones
const iconMap = {
  'Snowflake': Snowflake,
  'Utensils': Utensils,
  'ChefHat': ChefHat,
  'Beef': Beef,
  'UtensilsCrossed': UtensilsCrossed,
  'Package': Package,
}

// Componente do Produto em Destaque
const FeaturedProduct: React.FC<{ categoryId: string | number; onClose: () => void }> = ({ categoryId, onClose }) => {
  const { data: products, isLoading } = useFeaturedProductsByCategory(categoryId)
  
  const product = products?.[0] || {
    id: 'fallback',
    product_name: '',
    price: 0,
    image_url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20kitchen%20equipment%20product%20photography&image_size=square'
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="w-full h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="product-card bg-white rounded-lg p-4 shadow-sm border">
      <img
        src={product.image_url}
        alt="Produto"
        className="w-full h-32 object-cover rounded-lg mb-3"
        loading="lazy"
      />
      
      <Link
        to={`/produto/${product.id}`}
        className="block w-full py-2 bg-orange-500 text-white text-center text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
        onClick={onClose}
      >
        Ver Mais
      </Link>
    </div>
  )
}

// Componente do Dropdown
const CategoryDropdown: React.FC<{ 
  category: Category; 
  isOpen: boolean; 
  onClose: () => void;
  position?: 'left' | 'right' | 'center';
}> = ({ category, isOpen, onClose, position = 'left' }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Usar o hook de scroll isolado
  useIsolatedScroll(scrollContainerRef, isOpen)

  if (!isOpen) return null

  // Calcular posicionamento baseado na posição
  const getPositionClasses = () => {
    switch (position) {
      case 'right':
        return 'right-0 left-auto' // Alinha à direita
      case 'center':
        return 'left-1/2 transform -translate-x-1/2' // Centraliza
      default:
        return 'left-0' // Alinha à esquerda (padrão)
    }
  }

  return (
    <div 
      className={`nav-dropdown absolute top-full mt-1 z-50 w-screen max-w-lg ${getPositionClasses()}`} 
      ref={dropdownRef}
      style={{ maxWidth: 'min(calc(100vw - 2rem), 800px)' }}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        <style>{styles}</style>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            {category.icon && iconMap[category.icon as keyof typeof iconMap] && (
              React.createElement(iconMap[category.icon as keyof typeof iconMap], {
                className: "w-5 h-5 text-orange-500"
              })
            )}
            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Subcategorias - Aumentada em 80px */}
          <div className="flex-1 lg:flex-none lg:w-80 p-4 border-b lg:border-b-0 lg:border-r">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Subcategorias</h4>
            
            <div 
              ref={scrollContainerRef}
              className="space-y-1 max-h-64 overflow-y-auto scrollbar-custom scroll-container"
            >
              {category.subcategories && category.subcategories.length > 0 ? (
                <>
                  {category.subcategories.map((subcategory, index) => (
                    <Link
                      key={subcategory.id}
                      to={`/categorias/${subcategory.id}`}
                      className="subcategory-link block px-3 py-2 text-gray-700 hover:text-orange-600 rounded text-sm transition-all duration-150"
                      onClick={onClose}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-orange-400 rounded-full"></span>
                        {subcategory.name}
                      </span>
                    </Link>
                  ))}
                </>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  Nenhuma subcategoria disponível
                </p>
              )}
            </div>
          </div>

          {/* Produto em Destaque */}
          <div className="lg:w-64 p-4 bg-gray-50">
            <FeaturedProduct categoryId={category.id} onClose={onClose} />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t px-4 py-3">
          <div className="flex justify-between items-center">
            <Link
              to={`/categorias/${category.id}`}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              onClick={onClose}
            >
              Ver todos →
            </Link>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente Principal
const CategoryNav: React.FC<CategoryNavProps> = ({ categories, className = '' }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | number | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  // Categorias padrão para fallback
  const defaultCategories: Category[] = [
    { 
      id: 'refrigeracao-comercial', 
      name: 'Refrigeração Comercial', 
      icon: 'Snowflake',
      subcategories: [
        { id: 'freezers', name: 'Freezers' },
        { id: 'geladeiras', name: 'Geladeiras' },
        { id: 'expositores-frios', name: 'Expositores' },
        { id: 'camaras-frias', name: 'Câmaras Frias' },
        { id: 'maquinas-gelo', name: 'Máquinas de Gelo' },
        { id: 'balcoes-refrigerados', name: 'Balcões Refrigerados' }
      ]
    },
    { 
      id: 'bar-e-restaurante', 
      name: 'Bar e Restaurante', 
      icon: 'Utensils',
      subcategories: [
        { id: 'utensilios', name: 'Utensílios' },
        { id: 'equipamentos', name: 'Equipamentos' },
        { id: 'mobiliario', name: 'Mobiliário' },
        { id: 'panelas-industriais', name: 'Panelas Industriais' },
        { id: 'churrasqueiras', name: 'Churrasqueiras' },
        { id: 'fogoes-industriais', name: 'Fogões Industriais' },
        { id: 'exaustores', name: 'Exaustores' },
        { id: 'pias-industriais', name: 'Pias Industriais' }
      ]
    },
    { 
      id: 'padaria-e-confeitaria', 
      name: 'Padaria e Confeitaria', 
      icon: 'ChefHat',
      subcategories: [
        { id: 'fornos', name: 'Fornos' },
        { id: 'utensilios-padaria', name: 'Utensílios de Padaria' },
        { id: 'expositores', name: 'Expositores' },
        { id: 'amasadores', name: 'Amasadores' },
        { id: 'divisores', name: 'Divisores de Massa' },
        { id: 'modeladores', name: 'Modeladores' },
        { id: 'balancas', name: 'Balanças de Precisão' }
      ]
    },
    { 
      id: 'acougue', 
      name: 'Açougue', 
      icon: 'Beef',
      subcategories: [
        { id: 'carnes-bovinas', name: 'Carnes Bovinas' },
        { id: 'carnes-suinas', name: 'Carnes Suínas' },
        { id: 'aves', name: 'Aves' },
        { id: 'serras-fita', name: 'Serras de Fita' },
        { id: 'moedores', name: 'Moedores de Carne' },
        { id: 'embaladeiras', name: 'Embaladeiras' }
      ]
    },
    { 
      id: 'utilidades-domesticas', 
      name: 'Utilidades Domésticas', 
      icon: 'UtensilsCrossed',
      subcategories: [
        { id: 'panelas', name: 'Panelas' },
        { id: 'talheres', name: 'Talheres' },
        { id: 'acessorios', name: 'Acessórios' },
        { id: 'formas', name: 'Formas' },
        { id: 'jogos-panelas', name: 'Jogos de Panelas' }
      ]
    },
    { 
      id: 'mobiliario-em-inox', 
      name: 'Mobiliário em Inox', 
      icon: 'Package',
      subcategories: [
        { id: 'bancadas', name: 'Bancadas' },
        { id: 'armarios', name: 'Armários' },
        { id: 'prateleiras', name: 'Prateleiras' },
        { id: 'mesas-inox', name: 'Mesas em Inox' },
        { id: 'carrinhos', name: 'Carrinhos' }
      ]
    },
    { 
      id: 'limpeza-higiene', 
      name: 'Limpeza e Higiene', 
      icon: 'Package',
      subcategories: [
        { id: 'equipamentos-limpeza', name: 'Equipamentos de Limpeza' },
        { id: 'produtos-higiene', name: 'Produtos de Higiene' },
        { id: 'lavadoras', name: 'Lavadoras de Alta Pressão' }
      ]
    },
    { 
      id: 'embalar-armazenar', 
      name: 'Embalar e Armazenar', 
      icon: 'Package',
      subcategories: [
        { id: 'embalagens', name: 'Embalagens' },
        { id: 'recipientes', name: 'Recipientes' },
        { id: 'sistemas-armazenamento', name: 'Sistemas de Armazenamento' }
      ]
    },
    { 
      id: 'equipamentos-seguranca', 
      name: 'Equipamentos de Segurança', 
      icon: 'Package',
      subcategories: [
        { id: 'extintores', name: 'Extintores' },
        { id: 'luvas', name: 'Luvas de Proteção' },
        { id: 'mascaras', name: 'Máscaras' }
      ]
    },
  ]

  const categoriesToShow = categories && categories.length > 0 ? categories : defaultCategories

  const handleCategoryClick = (categoryId: string | number) => {
    setActiveDropdown(prev => prev === categoryId ? null : categoryId)
  }

  const closeDropdown = () => {
    setActiveDropdown(null)
  }

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        closeDropdown()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav ref={navRef} className={`bg-white shadow-sm border-b border-gray-200 relative ${className}`}>
      <style>{styles}</style>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 lg:space-x-2 overflow-x-auto py-2 w-full">
            {categoriesToShow.map((category, index) => {
              const isActive = activeDropdown === category.id
              const isLast = index === categoriesToShow.length - 1
              const isSecondLast = index === categoriesToShow.length - 2
              
              return (
                <div key={category.id} className="relative">
                  <button
                    onClick={() => handleCategoryClick(category.id)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive 
                        ? 'text-orange-600' 
                        : 'text-gray-700 hover:text-orange-600'
                    }`}
                  >
                    {category.icon && iconMap[category.icon as keyof typeof iconMap] && (
                      React.createElement(iconMap[category.icon as keyof typeof iconMap], {
                        className: "w-4 h-4"
                      })
                    )}
                    <span>{category.name}</span>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform ${
                        isActive ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  {isActive && (
                    <CategoryDropdown
                      category={category}
                      isOpen={isActive}
                      onClose={closeDropdown}
                      position={isLast ? 'right' : isSecondLast ? 'center' : 'left'}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default CategoryNav