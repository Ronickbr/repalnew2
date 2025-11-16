import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, X, Grid, List } from 'lucide-react';
import { useProductsByCategory, useProductsBySubcategory, useSubcategories } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import ProductCard from '../components/ProductCard';
import { OptimizedLoading, ProductCardSkeleton } from '../components/OptimizedLoading';
import type { ProductWithCategory } from '../types/product';
import { supabase } from '../lib/supabase';
import { table } from '../lib/schema';

interface CategoryWithSubcategories {
  id: string;
  name: string;
  slug: string;
  subcategories: { id: string; name: string; slug: string; }[];
}

const CategoryProducts: React.FC = () => {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debug params
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [subcatCount, setSubcatCount] = useState<number | null>(null);
  const [productsWithSubcatCount, setProductsWithSubcatCount] = useState<number | null>(null);
  const [exampleProducts, setExampleProducts] = useState<Array<{ id: number; name: string; slug: string; subcategory_id: number | null; subcategory_slug?: string; subcategory_name?: string }>>([]);
  const [debugLoading, setDebugLoading] = useState<boolean>(false);
  const [debugError, setDebugError] = useState<string | null>(null);

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
          slug: subcat.slug
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
  let currentCategory = finalCategories.find(cat => cat.id === categorySlug);
  
  // Se não encontrou como categoria principal, pode ser uma subcategoria
  if (!currentCategory) {
    // Procurar a subcategoria em todas as categorias
    for (const category of finalCategories) {
      const subcategory = category.subcategories.find(sub => sub.id === categorySlug);
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
  
  // Buscar subcategorias reais do banco de dados (com IDs numéricos)
  const currentCategoryId = currentCategory?.id ? parseInt(currentCategory.id) : undefined;
  const { data: dbSubcategories } = useSubcategories(currentCategoryId);
  
  // Buscar produtos - se estivermos em uma subcategoria, buscar diretamente pela subcategoria
  const targetCategorySlug = subcategorySlug || currentCategory?.slug || '';
  
  // Chamar ambos os hooks e escolher resultados conforme contexto para respeitar regras dos hooks
  const subRes = useProductsBySubcategory(subcategorySlug || '', currentCategory?.slug);
  const catRes = useProductsByCategory(targetCategorySlug);
  const allProducts = subcategorySlug ? subRes.data : catRes.data;
  const isLoading = subcategorySlug ? subRes.isLoading : catRes.isLoading;
  const error = subcategorySlug ? subRes.error : catRes.error;
  
  // Verificar se estamos usando fallback (mostrando produtos da categoria principal)
  const isUsingFallback = subcategorySlug && allProducts && allProducts.length > 0 && 
    allProducts.some(product => product.category?.slug === currentCategory?.slug);
  
  // Subcategorias disponíveis para a categoria atual
  const availableSubcategories = useMemo(() => {
    return currentCategory?.subcategories || [];
  }, [currentCategory]);
  
  // Mapeamento de slugs para IDs numéricos das subcategorias
  const subcategorySlugToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    if (dbSubcategories) {
      dbSubcategories.forEach(sub => {
        map.set(sub.slug, sub.id);
      });
    }
    return map;
  }, [dbSubcategories]);
  
  // Resetar subcategorias selecionadas quando mudar de categoria
  useEffect(() => {
    if (!subcategorySlug) {
      setSelectedSubcategories([]);
    } else {
      // Converter slug para ID numérico se possível
      const numericId = subcategorySlugToIdMap.get(subcategorySlug);
      if (numericId) {
        setSelectedSubcategories([numericId]);
      } else {
        setSelectedSubcategories([]);
      }
    }
  }, [categorySlug, subcategorySlug, subcategorySlugToIdMap]);

  const currentSubcategory = currentCategory?.subcategories.find(sub => sub.id === subcategorySlug);

  // Atualizar subcategorias selecionadas quando a URL mudar
  useEffect(() => {
    if (subcategorySlug) {
      // Converter slug para ID numérico se possível
      const numericId = subcategorySlugToIdMap.get(subcategorySlug);
      if (numericId) {
        setSelectedSubcategories([numericId]);
      } else {
        setSelectedSubcategories([]);
      }
    } else {
      setSelectedSubcategories([]);
    }
  }, [subcategorySlug, subcategorySlugToIdMap]);

  // Detectar modo debug via query string (?debug=1)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setDebugMode(params.get('debug') === '1');
  }, [location.search]);

  // Executar consultas de debug quando o modo estiver ativo
  useEffect(() => {
    const runDebugQueries = async () => {
      if (!debugMode) return;
      try {
        setDebugLoading(true);
        setDebugError(null);

        // 1) Contar subcategorias
        const subcatResp = await supabase
          .from('subcategories')
          .select('*', { count: 'exact', head: true });
        setSubcatCount(subcatResp.count ?? 0);

        // 2) Contar produtos com subcategory_id preenchido
        const prodCountResp = await supabase
          .from(table('products'))
          .select('id', { count: 'exact', head: true })
          .not('subcategory_id', 'is', null);
        setProductsWithSubcatCount(prodCountResp.count ?? 0);

        // 3) Buscar exemplos de produtos com subcategory_id
        const prodExamplesResp = await supabase
          .from(table('products'))
          .select('id, name, slug, subcategory_id')
          .not('subcategory_id', 'is', null)
          .limit(5);

        const examples = (prodExamplesResp.data || []) as Array<{ id: number; name: string; slug: string; subcategory_id: number }>; 

        // Buscar slugs das subcategorias correspondentes
        const subIds = Array.from(new Set(examples.map(e => e.subcategory_id).filter(Boolean)));
        let subMap = new Map<number, { slug: string; name: string }>();
        if (subIds.length > 0) {
          const subsResp = await supabase
            .from('subcategories')
            .select('id, slug, name')
            .in('id', subIds);
          (subsResp.data || []).forEach((s: any) => {
            subMap.set(s.id, { slug: s.slug, name: s.name });
          });
        }

        const enriched = examples.map(e => ({
          id: e.id,
          name: e.name,
          slug: e.slug,
          subcategory_id: e.subcategory_id,
          subcategory_slug: subMap.get(e.subcategory_id || 0)?.slug,
          subcategory_name: subMap.get(e.subcategory_id || 0)?.name,
        }));
        setExampleProducts(enriched);
      } catch (err: any) {
        setDebugError(err?.message || 'Erro ao executar consultas de debug');
      } finally {
        setDebugLoading(false);
      }
    };

    runDebugQueries();
  }, [debugMode]);

  // Função para navegar para a página de detalhes do produto
  const handleViewDetails = (product: ProductWithCategory) => {
    navigate(`/produto/${product.slug}`);
  };

  // Filtrar e ordenar produtos
  const filteredAndSortedProducts = useMemo(() => {
    if (!allProducts) return [];

    let filtered = allProducts.filter(product => {
      const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Se estivermos em uma categoria principal (não subcategoria) e houver subcategorias selecionadas
      // filtrar por subcategorias usando os IDs numéricos corretos
      let matchesSubcategory = true;
      
      if (!subcategorySlug && selectedSubcategories.length > 0) {
        // Converter o subcategory_id do produto (string) para número e comparar com os IDs selecionados
        const productSubcategoryId = product.subcategory_id ? parseInt(product.subcategory_id) : null;
        matchesSubcategory = productSubcategoryId !== null && selectedSubcategories.includes(productSubcategoryId);
      }
      
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
  }, [allProducts, searchTerm, selectedSubcategories, sortBy, subcategorySlug]);

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubcategories([]);
    setSortBy('name');
    // Se estivermos em uma subcategoria, voltar para a categoria principal
    if (subcategorySlug) {
      navigate(`/categorias/${currentCategory?.slug || categorySlug}`);
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
                  onClick={() => navigate(`/categorias/${categorySlug}`)}
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
          {/* Painel de Debug */}
          {debugMode && (
            <div className="w-full">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-yellow-900">Debug do Banco (Supabase)</h3>
                {debugLoading && (
                  <p className="text-yellow-800 mt-2 text-sm">Executando consultas...</p>
                )}
                {debugError && (
                  <p className="text-red-700 mt-2 text-sm">Erro: {debugError}</p>
                )}
                {!debugLoading && !debugError && (
                  <div className="mt-3 space-y-2 text-sm text-yellow-900">
                    <p>Subcategorias ativas (count): {subcatCount ?? '-'}</p>
                    <p>Produtos com subcategory_id (count): {productsWithSubcatCount ?? '-'}</p>
                    <div>
                      <p className="font-medium">Exemplos (máx 5):</p>
                      <ul className="list-disc ml-5 space-y-1">
                        {exampleProducts.map((p) => (
                          <li key={p.id} className="break-words">
                            {p.name} (slug: {p.slug}) → subcategoria: {p.subcategory_slug || '-'} ({p.subcategory_name || '-'})
                          </li>
                        ))}
                        {exampleProducts.length === 0 && (
                          <li>Nenhum produto com subcategoria encontrado.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
                <p className="text-xs text-yellow-700 mt-3">Adicione "?debug=1" à URL para ver este painel.</p>
              </div>
            </div>
          )}
          
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
                    value={currentCategory?.slug || ''}
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
                    <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      
                      <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2">
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
                {/* Mensagem de fallback quando mostrando produtos da categoria principal */}
                {isUsingFallback && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Search className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3 min-w-0">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Nenhum produto nesta subcategoria
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            Mostrando produtos da categoria principal "{currentCategory?.name}". 
                            Em breve adicionaremos produtos específicos para esta subcategoria.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
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
                <div className="text-center py-8 sm:py-12">
                  <div className="text-gray-400 mb-3 sm:mb-4">
                    <Search className="h-10 sm:h-12 w-10 sm:w-12 mx-auto" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                    Tente ajustar os filtros ou termos de busca.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="bg-red-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                  >
                    Limpar Filtros
                  </button>
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
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
                    
                    <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2">
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
                  value={currentCategory?.slug || ''}
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
                            <span className="text-gray-700 leading-tight">{subcategory.name}</span>
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