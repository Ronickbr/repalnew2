import React, { useState } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { Search, Grid, List, ArrowLeft } from 'lucide-react'
import { useProductsByCategory } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import ProductCard from '../components/ProductCard'
import WhatsAppButton from '../components/WhatsAppButton'

const Category: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const category = categories?.find(cat => cat.slug === slug)
  
  const { data: products, isLoading, error } = useProductsByCategory(category?.id || 0)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  // const [showMobileFilters, setShowMobileFilters] = useState(false)

  if (!category && categories && categories.length > 0) {
    return <Navigate to="/categorias" replace />
  }

  if (isLoading || !categories) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#333333] mb-4">Erro ao carregar produtos</h2>
          <p className="text-gray-600 mb-6">Ocorreu um erro ao carregar os produtos desta categoria.</p>
          <Link
            to="/categorias"
            className="bg-[#8B0000] text-white px-6 py-3 rounded-lg hover:bg-[#700000] transition-colors duration-200"
          >
            Voltar às Categorias
          </Link>
        </div>
      </div>
    )
  }

  // Filter products based on search term
  const filteredProducts = products?.filter(product =>
    product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.benefits?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-[#8B0000]">Início</Link>
          <span>/</span>
          <Link to="/categorias" className="hover:text-[#8B0000]">Categorias</Link>
          <span>/</span>
          <span className="text-[#333333] font-medium">{category?.name}</span>
        </nav>

        {/* Back Button */}
        <Link
          to="/categorias"
          className="inline-flex items-center space-x-2 text-[#000080] hover:text-[#000060] mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar às Categorias</span>
        </Link>

        {/* Category Header */}
        <div className="bg-gradient-to-r from-[#8B0000] to-[#000080] text-white rounded-lg p-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{category?.name}</h1>
          {category?.description && (
            <p className="text-lg opacity-90 max-w-3xl">
              {category.description}
            </p>
          )}
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
            </span>
            {/* Featured category badge removed as 'featured' property doesn't exist */}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] focus:border-transparent"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">Visualização:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-[#8B0000] text-white'
                      : 'text-gray-600 hover:text-[#8B0000]'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'list'
                      ? 'bg-[#8B0000] text-white'
                      : 'text-gray-600 hover:text-[#8B0000]'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {searchTerm && (
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-gray-600">Filtros ativos:</span>
              <span className="bg-[#8B0000] text-white text-sm px-3 py-1 rounded-full flex items-center space-x-2">
                <span>Busca: "{searchTerm}"</span>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-white hover:text-gray-200"
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#333333]">
            {searchTerm ? (
              <>Resultados para "{searchTerm}" em {category?.name}</>
            ) : (
              <>Produtos em {category?.name}</>
            )}
          </h2>
          <span className="text-gray-600">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </span>
        </div>

        {/* Products Grid/List */}
        {filteredProducts.length > 0 ? (
          <div className={`${
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }`}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
                onViewDetails={(product) => {
                  const slug = product.product_name
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-');
                  navigate(`/produto/${slug}`);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-[#333333] mb-2">
                {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? `Não encontramos produtos que correspondam à sua busca "${searchTerm}" nesta categoria.`
                  : 'Esta categoria ainda não possui produtos cadastrados.'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="bg-[#8B0000] text-white px-6 py-3 rounded-lg hover:bg-[#700000] transition-colors duration-200 mr-4"
                >
                  Limpar Busca
                </button>
              )}
              <Link
                to="/categorias"
                className="bg-[#000080] text-white px-6 py-3 rounded-lg hover:bg-[#000060] transition-colors duration-200 inline-block"
              >
                Ver Todos os Produtos
              </Link>
            </div>
          </div>
        )}

        {/* Related Categories */}
        {categories && categories.length > 1 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-[#333333] mb-6">Outras Categorias</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories
                .filter(cat => cat.id !== category?.id)
                .slice(0, 8)
                .map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/categoria/${cat.slug}`}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 text-center group"
                  >
                    <h4 className="font-medium text-[#333333] group-hover:text-[#8B0000] transition-colors duration-200">
                      {cat.name}
                    </h4>
                    {cat.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                  </Link>
                ))
              }
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-[#000080] to-[#8B0000] text-white rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Não encontrou o que procurava?
          </h3>
          <p className="text-lg mb-6 opacity-90">
            Nossa equipe pode ajudar você a encontrar o equipamento ideal para suas necessidades.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contato"
              className="bg-white text-[#000080] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Falar com Especialista
            </Link>
            <WhatsAppButton
              message="Olá! Preciso de ajuda para encontrar equipamentos para minha cozinha."
              className="bg-[#25D366] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#20B858] transition-colors duration-200"
            >
              WhatsApp
            </WhatsAppButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Category