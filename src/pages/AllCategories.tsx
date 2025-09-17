import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Grid,
  List
} from 'lucide-react';
import { Product } from '../lib/supabase';
import { useProducts } from '../hooks/useProducts';
import { useFilters } from '../hooks/useFilters';
import { usePagination } from '../hooks/usePagination';
import ProductCard from '../components/ProductCard';
import FilterPanel from '../components/FilterPanel';
// Imports removidos: SearchBar e CategoryMenu não utilizados
import LoadingSpinner from '../components/LoadingSpinner';

// Estilos CSS para animações
const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
    opacity: 0;
  }
`;

// Adicionar estilos ao documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Using Product interface from supabase

const AllCategories: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Hooks customizados
  const { products, loading, error, refetch } = useProducts();
  const {
    filters,
    filteredProducts,
    setSearchTerm,
    setSelectedCategory,
    setSelectedSubcategory,

    setSortBy,
    clearFilters
  } = useFilters(products);
  
  // Extrair propriedades dos filtros
  const { searchTerm, selectedCategory, selectedSubcategory, sortBy } = filters;
  
  const {
    currentPage,
    totalPages,
    setCurrentPage: goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    getCurrentPageItems
  } = usePagination({ 
    totalItems: filteredProducts?.length || 0, 
    itemsPerPage: 12 
  });
  
  // Obter produtos da página atual
  const paginatedProducts = useMemo(() => {
    return getCurrentPageItems(filteredProducts || []);
  }, [getCurrentPageItems, filteredProducts]);
  
  // Dados das categorias conforme especificação 4.1.1
  const categories = useMemo(() => [
    {
      id: 'refrigeracao-comercial',
      name: 'Refrigeração Comercial',
      subcategories: [
        { id: 'bebedouros', name: 'Bebedouros' },
        { id: 'camaras-frias', name: 'Câmaras Frias' },
        { id: 'cervejeiras', name: 'Cervejeiras' },
        { id: 'expositores', name: 'Expositores' },
        { id: 'freezers-comerciais', name: 'Freezers Comerciais' },
        { id: 'geladeiras-profissionais', name: 'Geladeiras Profissionais' },
        { id: 'ilhas-congelados', name: 'Ilhas para Congelados' },
        { id: 'visa-coolers', name: 'Visa-Coolers' }
      ]
    },
    {
      id: 'bares-restaurantes',
      name: 'Equipamentos para Bares e Restaurantes',
      subcategories: [
        { id: 'batedores-milk-shake', name: 'Batedores de Milk Shake' },
        { id: 'cafeteiras-profissionais', name: 'Cafeteiras Profissionais' },
        { id: 'chapas-gas-eletricas', name: 'Chapas a Gás e Elétricas' },
        { id: 'cilindros-massas', name: 'Cilindros de Massas' },
        { id: 'cortadores-legumes', name: 'Cortadores de Legumes' },
        { id: 'cutters', name: 'Cutters' },
        { id: 'descascadores-batata', name: 'Descascadores de Batata' },
        { id: 'estufas-quentes', name: 'Estufas Quentes' },
        { id: 'extratores-suco', name: 'Extratores de Suco' },
        { id: 'fogoes-industriais', name: 'Fogões Industriais' },
        { id: 'fornos-combinados', name: 'Fornos Combinados' },
        { id: 'fornos-conveccao', name: 'Fornos de Convecção' },
        { id: 'fornos-lastro', name: 'Fornos de Lastro' },
        { id: 'fritadeiras', name: 'Fritadeiras Elétricas e a Gás' },
        { id: 'lava-loucas-industriais', name: 'Lava-louças Industriais' },
        { id: 'liquidificadores-profissionais', name: 'Liquidificadores Profissionais' },
        { id: 'mesas-buffet', name: 'Mesas de Buffet' },
        { id: 'micro-ondas-industrial', name: 'Micro-ondas Industrial' },
        { id: 'moedores-cafe', name: 'Moedores de Café' },
        { id: 'moinhos-pao', name: 'Moinhos de Pão' },
        { id: 'processadores-alimentos', name: 'Processadores de Alimentos' },
        { id: 'refresqueiras', name: 'Refresqueiras' },
        { id: 'seladoras', name: 'Seladoras a Vácuo e de Embalagens' },
        { id: 'torres-chopp', name: 'Torres de Chopp' }
      ]
    },
    {
      id: 'padaria-confeitaria',
      name: 'Padaria e Confeitaria',
      subcategories: [
        { id: 'amassadeiras', name: 'Amassadeiras' },
        { id: 'batedeiras-industriais', name: 'Batedeiras Industriais' },
        { id: 'camaras-climaticas', name: 'Câmaras Climáticas' },
        { id: 'cortadores-frios', name: 'Cortadores de Frios' },
        { id: 'divisoras-massa', name: 'Divisoras de Massa' },
        { id: 'fatiadeiras-pao', name: 'Fatiadeiras de Pão' },
        { id: 'fornos-turbo', name: 'Fornos Turbo' },
        { id: 'modeladoras-pao', name: 'Modeladoras de Pão' },
        { id: 'resfriadores-agua', name: 'Resfriadores de Água' }
      ]
    },
    {
      id: 'acougue',
      name: 'Açougue',
      subcategories: [
        { id: 'amassadores-carne', name: 'Amassadores de Carne' },
        { id: 'aplicadores-filme', name: 'Aplicadores de Filme' },
        { id: 'assadores', name: 'Assadores' },
        { id: 'balancas', name: 'Balanças Digitais e Mecânicas' },
        { id: 'balcoes-refrigerados-acougue', name: 'Balcões Refrigerados para Açougue' },
        { id: 'ensacadeiras-linguica', name: 'Ensacadeiras de Linguiça' },
        { id: 'moedores-carne', name: 'Moedores de Carne' },
        { id: 'serras-fita', name: 'Serras-Fita' }
      ]
    },
    {
      id: 'utensilios-utilidades',
      name: 'Utensílios e Utilidades',
      subcategories: [
        { id: 'copos-tacas', name: 'Copos e Taças' },
        { id: 'cubas-gns', name: 'Cubas GN\'s' },
        { id: 'formas-assadeiras', name: 'Formas e Assadeiras' },
        { id: 'jarras', name: 'Jarras' },
        { id: 'loucas', name: 'Louças' },
        { id: 'panelas-profissionais', name: 'Panelas Profissionais' },
        { id: 'talheres', name: 'Talheres' },
        { id: 'travessas', name: 'Travessas' },
        { id: 'utensilios-diversos', name: 'Utensílios Diversos' }
      ]
    },
    {
      id: 'mobiliario-inox',
      name: 'Mobiliário em Inox',
      subcategories: [
        { id: 'bancadas-aco-inox', name: 'Bancadas em Aço Inox' },
        { id: 'carrinhos', name: 'Carrinhos' },
        { id: 'estantes', name: 'Estantes' },
        { id: 'lixeiras', name: 'Lixeiras' },
        { id: 'pias-assepsia', name: 'Pias de Assepsia' },
        { id: 'prateleiras', name: 'Prateleiras' }
      ]
    },
    {
      id: 'pecas-componentes-refrigeracao',
      name: 'Peças e Componentes para Refrigeração',
      subcategories: [
        { id: 'compressores', name: 'Compressores' },
        { id: 'conexoes', name: 'Conexões' },
        { id: 'controladores', name: 'Controladores' },
        { id: 'evaporadores', name: 'Evaporadores' },
        { id: 'filtros', name: 'Filtros' },
        { id: 'forcadores-ar', name: 'Forçadores de Ar' },
        { id: 'gas-refrigerante', name: 'Gás Refrigerante' },
        { id: 'isolamentos', name: 'Isolamentos' },
        { id: 'macaricos', name: 'Maçaricos' },
        { id: 'pecas-reposicao', name: 'Peças de Reposição' },
        { id: 'tubos-cobre', name: 'Tubos de Cobre' },
        { id: 'unidades-condensadoras', name: 'Unidades Condensadoras' },
        { id: 'valvulas', name: 'Válvulas' },
        { id: 'ventiladores', name: 'Ventiladores' }
      ]
    }
  ], []);

  // Removido searchSuggestions não utilizado

  // Fechar filtros mobile ao redimensionar e dropdown ao clicar fora
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowMobileFilters(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Handlers

  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingSpinner 
          size="lg" 
          text="Carregando produtos..." 
          fullScreen 
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar produtos</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={refetch}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Navegação */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          

          
          {/* Menu Dropdown de Categorias */}
           <div className="border-t border-gray-200 py-4">
             <div className="flex flex-wrap gap-2">
               {/* Botão Todas as Categorias */}
               <button
                 onClick={() => {
                   setSelectedCategory('all');
                   setSelectedSubcategory('');
                   setOpenDropdown(null);
                 }}
                 className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                   selectedCategory === 'all'
                     ? 'bg-red-600 text-white'
                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                 }`}
               >
                 Todas as Categorias
               </button>
               
               {/* Dropdowns das Categorias */}
               {categories.map((category) => (
                 <div key={category.id} className="relative dropdown-container">
                   <button
                     onClick={() => {
                       if (openDropdown === category.id) {
                         setOpenDropdown(null);
                       } else {
                         setOpenDropdown(category.id);
                       }
                     }}
                     className={`flex items-center px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                       selectedCategory === category.id
                         ? 'bg-red-600 text-white'
                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                     }`}
                   >
                     <span className="truncate max-w-32 sm:max-w-none">{category.name}</span>
                     <ChevronDown className={`w-4 h-4 ml-1 sm:ml-2 flex-shrink-0 transition-transform ${
                       openDropdown === category.id ? 'rotate-180' : ''
                     }`} />
                   </button>
                   
                   {/* Dropdown Menu */}
                   {openDropdown === category.id && (
                     <div className="absolute top-full left-0 mt-1 w-64 sm:w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                       <div className="p-2">
                         {/* Opção para categoria principal */}
                         <button
                           onClick={() => {
                             setSelectedCategory(category.id);
                             setSelectedSubcategory('');
                             setOpenDropdown(null);
                           }}
                           className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 rounded-md font-medium"
                         >
                           Todos em {category.name}
                         </button>
                         
                         {/* Separador */}
                         <div className="border-t border-gray-100 my-1"></div>
                         
                         {/* Subcategorias */}
                         {category.subcategories.map((subcategory) => (
                           <button
                             key={subcategory.id}
                             onClick={() => {
                               setSelectedCategory(category.id);
                               setSelectedSubcategory(subcategory.id);
                               setOpenDropdown(null);
                             }}
                             className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                               selectedCategory === category.id && selectedSubcategory === subcategory.id
                                 ? 'bg-red-50 text-red-600'
                                 : 'text-gray-700 hover:bg-gray-100'
                             }`}
                           >
                             {subcategory.name}
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtros Laterais - Desktop */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <FilterPanel
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onClearFilters={clearFilters}
                showFilters={true}
                onToggleFilters={() => {}}
                totalResults={filteredProducts?.length || 0}
              />
            </div>
          </aside>

          {/* Área Principal */}
          <main className="flex-1 min-w-0">
            {/* Barra de Controles */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {filteredProducts?.length || 0} produto{(filteredProducts?.length || 0) !== 1 ? 's' : ''} encontrado{(filteredProducts?.length || 0) !== 1 ? 's' : ''}
                </span>
                {selectedCategory !== 'all' && (
                  <span className="text-sm text-gray-500">
                    em {categories.find(cat => cat.id === selectedCategory)?.name || selectedCategory}
                    {selectedSubcategory && ` › ${selectedSubcategory}`}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-red-100 text-red-600'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Visualização em grade"
                  aria-label="Alternar para visualização em grade"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-red-100 text-red-600'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Visualização em lista"
                  aria-label="Alternar para visualização em lista"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Grid de Produtos */}
            {(paginatedProducts?.length || 0) > 0 ? (
              <div className={`grid gap-6 transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}>
                {(paginatedProducts as Product[]).map((product: Product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ProductCard
                      product={product}
                      viewMode={viewMode}
                      onAddToCart={() => {
                        // Implementar lógica do carrinho
                        // Adicionar ao carrinho
                      }}
                      onViewDetails={(product: Product) => {
                        navigate(`/produto/${product.slug}`);
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Não encontramos produtos que correspondam aos seus critérios de busca.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Limpar filtros
                  </button>
                </div>
              </div>
            )}

            {/* Paginação */}
            {(paginatedProducts?.length || 0) > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={prevPage}
                  disabled={!canGoPrev}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-red-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={nextPage}
                  disabled={!canGoNext}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Filtros Mobile Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <button
                onClick={toggleMobileFilters}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fechar filtros"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onClearFilters={clearFilters}
                showFilters={true}
                onToggleFilters={() => {}}
                totalResults={filteredProducts?.length || 0}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCategories;