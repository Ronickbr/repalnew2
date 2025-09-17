import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, X, Grid, List, ChevronDown, Loader2, Menu, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  product_name: string;
  description: string;
  price: number;
  slug: string;
  category?: {
    id: string;
    name: string;
  };
  images?: {
    id: string;
    image_url: string;
    alt_text: string;
  }[];
}

interface Category {
  id: string;
  name: string;
  product_count: number;
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  product_count: number;
}

const Categories: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const loading = categoriesLoading || productsLoading;

  // Fetch categories with subcategories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select(`
            id,
            name,
            products!inner(id)
          `);

        if (error) throw error;

        // Mock subcategories for demonstration
        const categoriesWithCount = data?.map(category => ({
          ...category,
          product_count: category.products?.length || 0,
          subcategories: [
            { id: `${category.id}-1`, name: `${category.name} Premium`, product_count: Math.floor(Math.random() * 10) + 1 },
            { id: `${category.id}-2`, name: `${category.name} Básico`, product_count: Math.floor(Math.random() * 10) + 1 },
            { id: `${category.id}-3`, name: `${category.name} Profissional`, product_count: Math.floor(Math.random() * 10) + 1 }
          ]
        })) || [];

        setCategories(categoriesWithCount);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            product_name,
            description,
            price,
            slug,
            categories!inner(id, name),
            product_images(id, image_url, alt_text)
          `);

        if (error) throw error;
        
        // Transform data to match Product interface
        const transformedProducts = data?.map(item => ({
          id: item.id,
          product_name: item.product_name,
          description: item.description,
          price: item.price,
          slug: item.slug,
          category: item.categories?.[0] || null,
          images: item.product_images || []
        })) || [];
        
        setProducts(transformedProducts);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category?.name === selectedCategory);
    }

    // Filter by subcategory (mock implementation)
    if (selectedSubcategory) {
      filtered = filtered.filter(product => product.category?.name === selectedCategory);
    }

    // Filter by price range
    if (priceRange.min) {
      filtered = filtered.filter(product => (product.price || 0) >= parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(product => (product.price || 0) <= parseFloat(priceRange.max));
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedSubcategory, priceRange]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price_desc':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'name_asc':
        return sorted.sort((a, b) => a.product_name.localeCompare(b.product_name));
      case 'name_desc':
        return sorted.sort((a, b) => b.product_name.localeCompare(a.product_name));
      default:
        return sorted;
    }
  }, [filteredProducts, sortBy]);

  // Pagination
  const itemsPerPage = 12;
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

  const hasActiveFilters = searchTerm || selectedCategory || selectedSubcategory || priceRange.min || priceRange.max;

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('relevance');
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-900 mx-auto mb-4" />
          <p className="text-gray-600">Carregando categorias...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-100 border-b py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-gray-600 text-sm mb-3">
            <Link to="/" className="hover:text-gray-800">Início</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-800">Categorias</span>
          </nav>
          
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Todas as Categorias</h1>
          <p className="text-gray-600">Explore nossa ampla seleção de produtos</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Desktop Category Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1 text-sm ${
                  selectedCategory === '' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Todas
              </button>
              {categories.slice(0, 6).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-3 py-1 text-sm ${
                    selectedCategory === category.name 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
              {categories.length > 6 && (
                <div className="relative group">
                  <button className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 flex items-center">
                    Mais
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible z-10">
                    <div className="py-1">
                      {categories.slice(6).map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.name)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Category Menu */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-blue-600"
              >
                <Menu className="w-4 h-4 mr-2" />
                Categorias
                <ChevronDown className={`w-4 h-4 ml-1 ${mobileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {mobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-t shadow-lg z-20">
                  <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedCategory('');
                          setMobileMenuOpen(false);
                        }}
                        className={`px-3 py-2 text-sm ${
                          selectedCategory === '' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                        }`}
                      >
                        Todas
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.name);
                            setMobileMenuOpen(false);
                          }}
                          className={`px-3 py-2 text-sm ${
                            selectedCategory === category.name 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Categories Dropdown */}
      {showMobileFilters && (
        <div className="lg:hidden bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedSubcategory('');
                  setShowMobileFilters(false);
                }}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCategory 
                    ? 'bg-red-900 text-white' 
                    : 'border border-gray-300 text-gray-700 hover:bg-red-50'
                }`}
              >
                Todas
              </button>
              {categories.slice(0, 7).map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.name);
                    setSelectedSubcategory('');
                    setShowMobileFilters(false);
                  }}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-red-900 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-red-50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-1/4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 lg:sticky lg:top-4">
              <div className="flex items-center mb-4">
                <Filter className="h-4 w-4 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="mb-4 p-3 bg-gray-50 border rounded">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Filtros Ativos:</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    {selectedCategory && (
                      <div className="flex items-center justify-between">
                        <span>Categoria: {selectedCategory}</span>
                        <button onClick={() => setSelectedCategory('')} className="text-gray-500 hover:text-gray-700">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {selectedSubcategory && (
                      <div className="flex items-center justify-between">
                        <span>Subcategoria: {selectedSubcategory}</span>
                        <button onClick={() => setSelectedSubcategory('')} className="text-gray-500 hover:text-gray-700">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {searchTerm && (
                      <div className="flex items-center justify-between">
                        <span>Busca: "{searchTerm}"</span>
                        <button onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-gray-700">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Produto</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Digite o nome do produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                {categoriesLoading ? (
                  <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center">
                        <input 
                          type="radio" 
                          name="category"
                          value={category.name}
                          checked={selectedCategory === category.name}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {category.name} ({category.product_count})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>



              {/* Sort Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="relevance">Mais Relevantes</option>

                  <option value="name_asc">Nome A-Z</option>
                  <option value="name_desc">Nome Z-A</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button 
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className={`w-full py-2 px-4 rounded border text-sm ${
                  hasActiveFilters 
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                }`}
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Produtos</h2>
                <div className="flex items-center space-x-4">
                  <p className="text-gray-600">
                    Encontrados {sortedProducts.length} produto{sortedProducts.length !== 1 ? 's' : ''}
                  </p>
                  {hasActiveFilters && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Filtros ativos
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                <span className="text-sm text-gray-600">Visualização:</span>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-red-900 text-white' : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-red-900 text-white' : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Products */}
            {productsLoading ? (
              <div className="space-y-6">
                {/* Loading skeleton for products */}
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gray-200"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">Nenhum produto encontrado</p>
                <p className="text-gray-500">Tente ajustar os filtros ou termos de busca</p>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {paginatedProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/produto/${product.slug}`}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square">
                      <img
                        src={product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'}
                        alt={product.images?.[0]?.alt_text || product.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="text-sm text-gray-600 mb-1">
                        {product.category?.name}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.product_name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        <div 
                          className="prose prose-gray max-w-none text-sm"
                          dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-red-600 font-semibold">
                          Entre em contato para consultar preços
                        </span>
                        <span className="text-sm text-blue-600 hover:text-blue-800">
                          Ver Detalhes
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Paginação */}
            {!productsLoading && totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-12">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-red-900 text-white'
                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;