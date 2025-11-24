import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, X, Grid, List } from 'lucide-react';
import { useProductsByCategory, useProductsBySubcategory, useSubcategories } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import ProductCard from '../components/ProductCard';
import { OptimizedLoading, ProductCardSkeleton } from '../components/OptimizedLoading';
import type { ProductWithCategory } from '../types/product';
 

interface CategoryWithSubcategories {
  id: string;
  name: string;
  slug: string;
  subcategories: { id: string; name: string; slug: string; numericId?: number; }[];
}

const CategoryProducts: React.FC = () => {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Obter parâmetros da query string (prioridade sobre route params)
  const categoriaId = searchParams.get('categoriaId') || categorySlug;
  const subcategoriaId = searchParams.get('subcategoriaId') || subcategorySlug;

  

  // Buscar categorias do Supabase
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useCategories();

  // Transformar dados do Supabase para o formato esperado pelo componente
  const categories: CategoryWithSubcategories[] = useMemo(() => {
    if (!categoriesData) return [];

    // Separar categorias principais (parent_id = null) e subcategorias
    const parentCategories = categoriesData.filter(cat => !cat.parent_id);
    const subcategories = categoriesData.filter(cat => cat.parent_id);

    // Mapear categorias principais com suas subcategorias
    return parentCategories.map(parentCat => ({
      id: parentCat.slug,
      name: parentCat.name,
      slug: parentCat.slug,
      subcategories: subcategories
        .filter(subcat => subcat.parent_id === parentCat.id)
        .map(subcat => ({
          id: subcat.slug,
          name: subcat.name,
          slug: subcat.slug,
          numericId: subcat.id // Guardar o ID numérico para referência
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [categoriesData]);

  // Dados de fallback caso não haja conexão com o banco
  const fallbackCategories: CategoryWithSubcategories[] = [
    {
      id: 'acougue',
      name: 'Açougue',
      slug: 'acougue',
      subcategories: [
        { id: 'amaciadores-carne', name: 'Amaciadores de Carne', slug: 'amaciadores-carne' },
        { id: 'aplicadores-filme', name: 'Aplicadores de Filme', slug: 'aplicadores-filme' },
        { id: 'assadores', name: 'Assadores', slug: 'assadores' },
        { id: 'balancas', name: 'Balanças Digitais e Mecânicas', slug: 'balancas' },
        { id: 'balcoes-refrigerados-acougue', name: 'Balcões Refrigerados para Açougue', slug: 'balcoes-refrigerados-acougue' },
        { id: 'ensacadeiras-linguica', name: 'Ensacadeiras de Linguiça', slug: 'ensacadeiras-linguica' },
        { id: 'moedores-carne', name: 'Moedores de Carne', slug: 'moedores-carne' },
        { id: 'serras-fita', name: 'Serras-Fita', slug: 'serras-fita' }
      ]
    },
    {
      id: 'refrigeracao-comercial',
      name: 'Refrigeração Comercial',
      slug: 'refrigeracao-comercial',
      subcategories: [
        { id: 'bebedouros', name: 'Bebedouros', slug: 'bebedouros' },
        { id: 'camaras-frias', name: 'Câmaras Frias', slug: 'camaras-frias' },
        { id: 'cervejeiras', name: 'Cervejeiras', slug: 'cervejeiras' },
        { id: 'expositores', name: 'Expositores', slug: 'expositores' },
        { id: 'freezers-comerciais', name: 'Freezers Comerciais', slug: 'freezers-comerciais' },
        { id: 'geladeiras-profissionais', name: 'Geladeiras Profissionais', slug: 'geladeiras-profissionais' },
        { id: 'ilhas-congelados', name: 'Ilhas para Congelados', slug: 'ilhas-congelados' },
        { id: 'visa-coolers', name: 'Visa-Coolers', slug: 'visa-coolers' }
      ]
    }
  ];

  // Usar dados do Supabase ou fallback em caso de erro
  const finalCategories = categoriesError || categories.length === 0 ? fallbackCategories : categories;

  // Encontrar categoria atual - primeiro verificar se é uma categoria principal
  let currentCategory = finalCategories.find(cat => cat.id === categoriaId);
  
  // Se não encontrou como categoria principal, pode ser uma subcategoria
  if (!currentCategory) {
    // Procurar a subcategoria em todas as categorias
    for (const category of finalCategories) {
      const subcategory = category.subcategories.find(sub => sub.id === categoriaId);
      if (subcategory) {
        currentCategory = category;
        break;
      }
    }
  }
  
  // Se ainda não encontrou, usar a primeira categoria como fallback
  if (!currentCategory) {
    currentCategory = finalCategories[0];
  }
  
  // Buscar subcategorias reais do banco de dados
  // Como currentCategory.id é um slug, precisamos encontrar o ID numérico correspondente
  const currentCategoryNumericId = useMemo(() => {
    if (!categoriesData || !currentCategory) return undefined;
    
    // Encontrar a categoria no banco de dados pelo slug
    const categoryInDb = categoriesData.find(cat => cat.slug === currentCategory.id);
    return categoryInDb?.id;
  }, [categoriesData, currentCategory]);
  
  const { data: dbSubcategories } = useSubcategories(currentCategoryNumericId);
  
  // Mapeamento de slugs para IDs numéricos das subcategorias
  const subcategorySlugToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    
    // Primeiro, mapear as subcategorias que já temos (do processamento inicial)
    if (currentCategory?.subcategories) {
      currentCategory.subcategories.forEach(sub => {
        if (sub.numericId) {
          map.set(sub.id, sub.numericId); // sub.id é o slug, sub.numericId é o ID numérico
        }
      });
    }
    
    // Depois, adicionar/confirmar com as subcategorias do banco
    if (dbSubcategories) {
      dbSubcategories.forEach(sub => {
        map.set(sub.slug, sub.id);
      });
    }
    
    return map;
  }, [dbSubcategories, currentCategory]);
  
  // Buscar produtos - se estivermos em uma subcategoria, buscar diretamente pela subcategoria
  const targetCategorySlug = subcategoriaId || currentCategory?.slug || '';

  const subcategoryIdNumeric = useMemo(() => {
    if (!subcategoriaId) return undefined;
    return subcategorySlugToIdMap.get(subcategoriaId);
  }, [subcategoriaId, subcategorySlugToIdMap]);

  const effectiveSubcategoryIdForHook = (subcategoryIdNumeric ?? subcategoriaId ?? '') as string | number;

  const subRes = useProductsBySubcategory(effectiveSubcategoryIdForHook, currentCategory?.slug);
  const catRes = useProductsByCategory(targetCategorySlug);
  const allProducts = subcategoriaId ? subRes.data : catRes.data;
  const isLoading = subcategoriaId ? subRes.isLoading : catRes.isLoading;
  const error = subcategoriaId ? subRes.error : catRes.error;

  const subcategoryCounts = useMemo(() => {
    const map = new Map<number, number>();
    (catRes.data || []).forEach((p) => {
      const sid = p.subcategory_id !== undefined && p.subcategory_id !== null ? Number(p.subcategory_id) : null;
      if (sid !== null) {
        map.set(sid, (map.get(sid) || 0) + 1);
      }
    });
    return map;
  }, [catRes.data]);
  
  
  
  // Subcategorias disponíveis para a categoria atual
  const availableSubcategories = useMemo(() => {
    if (dbSubcategories && dbSubcategories.length > 0) {
      return dbSubcategories.map((sub: any) => ({
        id: sub.slug,
        name: sub.name,
        slug: sub.slug,
        numericId: sub.id
      })).sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
    return currentCategory?.subcategories || [];
  }, [dbSubcategories, currentCategory]);
  
  // Resetar subcategorias selecionadas quando mudar de categoria
  useEffect(() => {
    if (!subcategoriaId) {
      setSelectedSubcategories([]);
    } else {
      // Converter slug para ID numérico se possível
      const numericId = subcategorySlugToIdMap.get(subcategoriaId);
      if (numericId) {
        setSelectedSubcategories([numericId]);
      } else {
        setSelectedSubcategories([]);
      }
    }
  }, [categoriaId, subcategoriaId, subcategorySlugToIdMap]);

  const currentSubcategory = currentCategory?.subcategories.find(sub => sub.id === subcategoriaId);

  // Atualizar subcategorias selecionadas quando a URL mudar
  useEffect(() => {
    if (subcategoriaId) {
      // Converter slug para ID numérico se possível
      const numericId = subcategorySlugToIdMap.get(subcategoriaId);
      if (numericId) {
        setSelectedSubcategories([numericId]);
      } else {
        setSelectedSubcategories([]);
      }
    } else {
      setSelectedSubcategories([]);
    }
  }, [subcategoriaId, subcategorySlugToIdMap]);

  

  // Aplicar filtros automáticos baseados nos parâmetros da URL
  useEffect(() => {
    // Se houver subcategoria na URL, aplicar o filtro automaticamente
    if (subcategoriaId && currentCategory) {
      // Encontrar a subcategoria correspondente
      const targetSubcategory = currentCategory.subcategories.find(sub => sub.id === subcategoriaId);
      if (targetSubcategory) {
        // Converter slug para ID numérico se possível
        const numericId = subcategorySlugToIdMap.get(subcategoriaId);
        if (numericId) {
          setSelectedSubcategories([numericId]);
        }
      }
    }
  }, [subcategoriaId, currentCategory, subcategorySlugToIdMap]);

  // (Removido) Blocos de debug que consultavam tabela inexistente

  // Função para navegar para a página de detalhes do produto
  const handleViewDetails = (product: ProductWithCategory) => {
    navigate(`/produto/${product.slug}`);
  };

  // Filtrar e ordenar produtos
  const filteredAndSortedProducts = useMemo(() => {
    if (!allProducts) return [];
    
    const activeSubcategoryIds: number[] = (() => {
      if (selectedSubcategories.length > 0) return selectedSubcategories;
      if (subcategoriaId) {
        const numericId = subcategorySlugToIdMap.get(subcategoriaId);
        return numericId ? [numericId] : [];
      }
      return [];
    })();

    let filtered = allProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const productSubcategoryId = product.subcategory_id !== undefined && product.subcategory_id !== null
        ? Number(product.subcategory_id)
        : null;

      const hasActiveSubs = activeSubcategoryIds.length > 0 || !!subcategoriaId;
      const matchesSubcategory = hasActiveSubs
        ? (productSubcategoryId !== null && activeSubcategoryIds.includes(productSubcategoryId))
        : true;

      return matchesSearch && matchesSubcategory;
    });

    // Ordenar produtos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allProducts, searchTerm, selectedSubcategories, sortBy, subcategoriaId]);

  const activeSubcategoryIds = useMemo(() => {
    if (selectedSubcategories.length > 0) return selectedSubcategories;
    if (subcategoriaId) {
      const numericId = subcategorySlugToIdMap.get(subcategoriaId);
      return numericId ? [numericId] : [];
    }
    return [];
  }, [selectedSubcategories, subcategoriaId, subcategorySlugToIdMap]);

  useEffect(() => {
    const initialSearch = searchParams.get('q');
    const initialSort = searchParams.get('sort');
    const initialView = searchParams.get('view');

    if (initialSearch !== null) setSearchTerm(initialSearch);
    if (initialSort === 'name' || initialSort === 'price-asc' || initialSort === 'price-desc') {
      setSortBy(initialSort as 'name' | 'price-asc' | 'price-desc');
    }
    if (initialView === 'grid' || initialView === 'list') {
      setViewMode(initialView as 'grid' | 'list');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!subcategoriaId) {
      const subsParam = searchParams.get('subs');
      if (subsParam) {
        const ids = subsParam.split(',')
          .map(v => parseInt(v))
          .filter(n => !Number.isNaN(n));
        setSelectedSubcategories(ids);
      } else {
        setSelectedSubcategories([]);
      }
    }
  }, [searchParams, subcategoriaId]);

  useEffect(() => {
    if (!subcategoriaId) {
      const params = new URLSearchParams(searchParams);
      if (selectedSubcategories.length > 0) {
        params.set('subs', selectedSubcategories.join(','));
      } else {
        params.delete('subs');
      }
      setSearchParams(params, { replace: true });
    }
  }, [selectedSubcategories, subcategoriaId, searchParams, setSearchParams]);

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubcategories([]);
    setSortBy('name');
    // Se estivermos em uma subcategoria, voltar para a categoria principal
    if (subcategoriaId) {
      navigate(`/categorias/${currentCategory?.slug || categoriaId}`);
    }
  };

  if (isLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <OptimizedLoading size="lg" text="Carregando produtos..." showText={true} />
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-500 hover:text-gray-700 transition-colors truncate"
                >
                  Início
                </button>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <button
                  onClick={() => navigate(`/categorias/${categoriaId}`)}
                  className="text-gray-500 hover:text-gray-700 transition-colors truncate max-w-[120px] sm:max-w-none"
                >
                  {currentCategory.name}
                </button>
              </li>
              {currentSubcategory && (
                <>
                  <li className="text-gray-400">/</li>
                  <li className="text-gray-900 font-medium truncate max-w-[120px] sm:max-w-none">
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              {currentSubcategory ? currentSubcategory.name : currentCategory.name}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-full sm:max-w-2xl md:max-w-3xl mx-auto leading-relaxed px-2">
              {currentSubcategory 
                ? `Explore nossa seleção de ${currentSubcategory.name.toLowerCase()} de alta qualidade.`
                : `Descubra nossa ampla gama de equipamentos para ${currentCategory.name.toLowerCase()}.`
              }
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          
          
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 w-full">
            {/* Sidebar de filtros - Desktop */}
            <div className="hidden lg:block w-full lg:w-64 xl:w-72 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
                
                {/* Seletor de Categoria */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={currentCategory?.slug || categoriaId || ''}
                    onChange={(e) => {
                      const selectedCategory = finalCategories.find(cat => cat.slug === e.target.value);
                      if (selectedCategory) {
                        navigate(`/categorias/${selectedCategory.slug}`);
                        setSelectedSubcategories([]); // Limpar subcategorias selecionadas ao mudar de categoria
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  >
                    {finalCategories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  
                {/* Removido: info de categoria/subcategorias */}
                </div>
                
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Subcategorias */}
                {availableSubcategories.length > 0 && (
                  <div className="mb-6">
                    <label id="subcategory-filter-label" className="block text-sm font-medium text-gray-700 mb-3">
                      Filtrar por Subcategoria ({availableSubcategories.length} disponíveis)
                    </label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedSubcategories([])}
                        className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-all duration-200 text-sm ${
                          selectedSubcategories.length === 0
                            ? 'bg-red-50 border-red-200 text-red-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <span className="flex items-center justify-between">
                          Todas as subcategorias
                          {selectedSubcategories.length === 0 && (
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                        </span>
                      </button>
                      
                      <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2" role="group" aria-labelledby="subcategory-filter-label">
                        {availableSubcategories.map((subcategory) => {
                          // Obter o ID numérico real da subcategoria
                          const numericId = subcategorySlugToIdMap.get(subcategory.id);
                          const count = numericId ? (subcategoryCounts.get(numericId) || 0) : 0;
                          
                          return (
                            <label
                              key={subcategory.id}
                              className="flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={numericId ? selectedSubcategories.includes(numericId) : false}
                                onChange={(e) => {
                                  if (numericId) {
                                    if (e.target.checked) {
                                      setSelectedSubcategories(prev => [...prev, numericId]);
                                    } else {
                                      setSelectedSubcategories(prev => prev.filter(id => id !== numericId));
                                    }
                                  }
                                }}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500 flex-shrink-0"
                              />
                              <span className="text-sm text-gray-700 flex-1 leading-tight">{subcategory.name} <span className="text-gray-500">({count})</span></span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Removido: aviso quando não há subcategorias */}

                {/* Limpar filtros */}
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>

            {/* Conteúdo principal */}
            <div className="flex-1 min-w-0">
              {/* Barra de ferramentas mobile */}
              <div className="lg:hidden mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className="flex items-center space-x-2 bg-white border border-gray-300 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Filter className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Filtros</span>
                    <span className="sm:hidden">Filtrar</span>
                  </button>
                  
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      aria-label="Visualização em grade"
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
                      aria-label="Visualização em lista"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Busca mobile */}
                <div className="relative mb-3 sm:mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar produtos..."
                    className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Resultados */}
              <div className="mb-4 sm:mb-6">
                {/* Removido: banner de fallback para subcategoria */}
                
                <div className="flex items-center justify-between">
                  <p className="text-sm sm:text-base text-gray-600">
                    {filteredAndSortedProducts.length} produto{filteredAndSortedProducts.length !== 1 ? 's' : ''} encontrado{filteredAndSortedProducts.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Grid de produtos */}
              {isLoading ? (
                <div className={`grid gap-4 sm:gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  <ProductCardSkeleton count={9} />
                </div>
              ) : filteredAndSortedProducts.length > 0 ? (
                <div className={`grid gap-4 sm:gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {filteredAndSortedProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      className={viewMode === 'list' ? 'flex-row' : ''}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              ) : (
                activeSubcategoryIds.length > 0 || subcategoriaId ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-gray-400 mb-3 sm:mb-4">
                      <Search className="h-10 sm:h-12 w-10 sm:w-12 mx-auto" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
                      Não há produtos disponíveis nesta subcategoria
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                      Selecione outra subcategoria para visualizar produtos.
                    </p>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de filtros mobile */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-xs sm:max-w-sm bg-white shadow-xl transform transition-transform overflow-y-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filtros</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fechar filtros"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
              {/* Subcategorias */}
              {availableSubcategories.length > 0 && (
                <div>
                  <label id="subcategory-filter-label-mobile" className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Subcategoria
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedSubcategories([])}
                      className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-all duration-200 text-sm ${
                        selectedSubcategories.length === 0
                          ? 'bg-red-50 border-red-200 text-red-700 font-medium'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        Todas as subcategorias
                        {selectedSubcategories.length === 0 && (
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </span>
                    </button>
                    
                    <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2" role="group" aria-labelledby="subcategory-filter-label-mobile">
                      {availableSubcategories.map((subcategory) => {
                        // Obter o ID numérico real da subcategoria
                        const numericId = subcategorySlugToIdMap.get(subcategory.id);
                        
                        return (
                          <label
                            key={subcategory.id}
                            className="flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={numericId ? selectedSubcategories.includes(numericId) : false}
                              onChange={(e) => {
                                if (numericId) {
                                  if (e.target.checked) {
                                    setSelectedSubcategories(prev => [...prev, numericId]);
                                  } else {
                                    setSelectedSubcategories(prev => prev.filter(id => id !== numericId));
                                  }
                                }
                              }}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500 flex-shrink-0"
                            />
                            <span className="text-sm text-gray-700 flex-1 leading-tight">{subcategory.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Categoria e Subcategorias - Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={currentCategory?.slug || categoriaId || ''}
                  onChange={(e) => {
                    const selectedCategory = finalCategories.find(cat => cat.slug === e.target.value);
                    if (selectedCategory) {
                      navigate(`/categorias/${selectedCategory.slug}`);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4 text-sm"
                >
                  {finalCategories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                
                {availableSubcategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategorias
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableSubcategories.map((subcategory) => {
                        // Obter o ID numérico real da subcategoria
                        const numericId = subcategorySlugToIdMap.get(subcategory.id);
                        const count = numericId ? (subcategoryCounts.get(numericId) || 0) : 0;
                        
                        return (
                          <label key={subcategory.id} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={numericId ? selectedSubcategories.includes(numericId) : false}
                              onChange={(e) => {
                                if (numericId) {
                                  if (e.target.checked) {
                                    setSelectedSubcategories(prev => [...prev, numericId]);
                                  } else {
                                    setSelectedSubcategories(prev => prev.filter(id => id !== numericId));
                                  }
                                }
                              }}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500 flex-shrink-0"
                            />
                            <span className="text-gray-700 leading-tight">{subcategory.name} <span className="text-gray-500">({count})</span></span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="space-y-2 sm:space-y-3 pt-4 sticky bottom-0 bg-white pb-4">
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 sm:py-3 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Limpar Filtros
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full bg-red-600 text-white px-4 py-2 sm:py-3 rounded-lg hover:bg-red-700 transition-colors text-sm"
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
