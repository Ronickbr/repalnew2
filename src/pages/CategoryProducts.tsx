import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Filter, X, Grid, List } from 'lucide-react';
import { useProductsByCategory } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

interface Category {
  id: string;
  name: string;
  subcategories: { id: string; name: string; }[];
}

const CategoryProducts: React.FC = () => {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug?: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(subcategorySlug || '');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Buscar produtos da categoria usando slug
  const { data: products, isLoading, error } = useProductsByCategory(categorySlug || '');

  // Definir categorias usando slugs (mesmo array do Header.tsx)
  const categories: Category[] = [
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
      name: 'Bares e Restaurantes',
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
        { id: 'fritadeiras', name: 'Fritadeiras' },
        { id: 'grelhas-sanduicheiras', name: 'Grelhas e Sanduicheiras' },
        { id: 'liquidificadores-industriais', name: 'Liquidificadores Industriais' },
        { id: 'maquinas-gelo', name: 'Máquinas de Gelo' },
        { id: 'moedores-carne', name: 'Moedores de Carne' },
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
  ];

  // Encontrar categoria atual
  const currentCategory = categories.find(cat => cat.id === categorySlug) || categories[0];
  
  // Subcategorias disponíveis para a categoria atual
  const availableSubcategories = useMemo(() => {
    return currentCategory?.subcategories || [];
  }, [currentCategory]);
  
  // Resetar subcategoria selecionada quando mudar de categoria
  useEffect(() => {
    if (!subcategorySlug) {
      setSelectedSubcategory('');
    } else {
      setSelectedSubcategory(subcategorySlug);
    }
  }, [categorySlug, subcategorySlug]);
  
  const currentSubcategory = currentCategory?.subcategories.find(sub => sub.id === subcategorySlug);

  // Atualizar subcategoria selecionada quando a URL mudar
  useEffect(() => {
    setSelectedSubcategory(subcategorySlug || '');
  }, [subcategorySlug]);

  // Filtrar e ordenar produtos
  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products.filter(product => {
      const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubcategory = !selectedSubcategory || 
                                product.subcategory?.slug === selectedSubcategory;
      
      return matchesSearch && matchesSubcategory;
    });

    // Ordenar produtos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.product_name.localeCompare(b.product_name);
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedSubcategory, sortBy]);

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubcategory('');
    setSortBy('name');
    if (subcategorySlug) {
      navigate(`/categorias/${categorySlug}`);
    }
  };

  // Função para navegar para subcategoria
  const handleSubcategoryChange = (subcatId: string) => {
    setSelectedSubcategory(subcatId);
    if (subcatId) {
      navigate(`/categorias/${categorySlug}/${subcatId}`);
    } else {
      navigate(`/categorias/${categorySlug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar produtos</h2>
          <p className="text-gray-600 mb-4">Ocorreu um erro ao buscar os produtos desta categoria.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Categoria não encontrada</h2>
          <p className="text-gray-600 mb-4">A categoria solicitada não existe.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Início
                </button>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <button
                  onClick={() => navigate(`/categorias/${categorySlug}`)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {currentCategory.name}
                </button>
              </li>
              {currentSubcategory && (
                <>
                  <li className="text-gray-400">/</li>
                  <li className="text-gray-900 font-medium">
                    {currentSubcategory.name}
                  </li>
                </>
              )}
            </ol>
          </nav>
        </div>
      </div>

      {/* Header da categoria */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {currentSubcategory ? currentSubcategory.name : currentCategory.name}
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {currentSubcategory 
                ? `Explore nossa seleção de ${currentSubcategory.name.toLowerCase()} de alta qualidade.`
                : `Descubra nossa ampla gama de equipamentos para ${currentCategory.name.toLowerCase()}.`
              }
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de filtros - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
              
              {/* Busca */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar produtos
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Digite o nome do produto..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Subcategorias */}
              {availableSubcategories.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Filtrar por Subcategoria
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleSubcategoryChange('')}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                        selectedSubcategory === ''
                          ? 'bg-red-50 border-red-200 text-red-700 font-medium'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        Todas as subcategorias
                        {selectedSubcategory === '' && (
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </span>
                    </button>
                    
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {availableSubcategories.map((subcategory) => (
                        <button
                          key={subcategory.id}
                          onClick={() => handleSubcategoryChange(subcategory.id)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm ${
                            selectedSubcategory === subcategory.id
                              ? 'bg-red-50 border-red-200 text-red-700 font-medium'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <span className="flex items-center justify-between">
                            {subcategory.name}
                            {selectedSubcategory === subcategory.id && (
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Ordenação */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'price-asc' | 'price-desc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="name">Nome (A-Z)</option>
                  <option value="price-asc">Preço (Menor para Maior)</option>
                  <option value="price-desc">Preço (Maior para Menor)</option>
                </select>
              </div>

              {/* Limpar filtros */}
              <button
                onClick={clearFilters}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1">
            {/* Barra de ferramentas mobile */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtros</span>
                </button>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Busca mobile */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Resultados */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  {filteredAndSortedProducts.length} produto{filteredAndSortedProducts.length !== 1 ? 's' : ''} encontrado{filteredAndSortedProducts.length !== 1 ? 's' : ''}
                </p>
                
                {/* Ordenação desktop */}
                <div className="hidden lg:flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Ordenar por:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'price-asc' | 'price-desc')}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="name">Nome</option>
                    <option value="price-asc">Preço ↑</option>
                    <option value="price-desc">Preço ↓</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid de produtos */}
            {filteredAndSortedProducts.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
              }`}>
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    className={viewMode === 'list' ? 'flex-row' : ''}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Tente ajustar os filtros ou termos de busca.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de filtros mobile */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Subcategorias */}
              {availableSubcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Filtrar por Subcategoria
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleSubcategoryChange('')}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                        selectedSubcategory === ''
                          ? 'bg-red-50 border-red-200 text-red-700 font-medium'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        Todas as subcategorias
                        {selectedSubcategory === '' && (
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </span>
                    </button>
                    
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {availableSubcategories.map((subcategory) => (
                        <button
                          key={subcategory.id}
                          onClick={() => handleSubcategoryChange(subcategory.id)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm ${
                            selectedSubcategory === subcategory.id
                              ? 'bg-red-50 border-red-200 text-red-700 font-medium'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <span className="flex items-center justify-between">
                            {subcategory.name}
                            {selectedSubcategory === subcategory.id && (
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Ordenação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'price-asc' | 'price-desc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="name">Nome (A-Z)</option>
                  <option value="price-asc">Preço (Menor para Maior)</option>
                  <option value="price-desc">Preço (Maior para Menor)</option>
                </select>
              </div>

              {/* Botões */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Limpar Filtros
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryProducts;