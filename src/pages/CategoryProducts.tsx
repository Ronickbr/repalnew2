import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Search, Filter, ChevronLeft, ChevronRight, Grid2x2, List } from 'lucide-react'
import { useCategories, useSubcategoriesByCategory } from '../hooks/useCategories'
import { useProductsByCategory } from '../hooks/useProducts'
import type { ProductWithCategory } from '../types/product'
import ProductCard from '../components/ProductCard'
import { useAccessibility } from '../hooks/useAccessibility'

type ViewMode = 'grid' | 'list'

const CategoryProducts: React.FC = () => {
  const { categorySlug, subcategorySlug } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get('view') as ViewMode) || 'grid')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(12)
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(() => {
    const fromQuery = searchParams.get('sub')
    if (fromQuery) return fromQuery.split(',').filter(Boolean)
    return subcategorySlug ? [subcategorySlug] : []
  })
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  const { trapFocus } = useAccessibility()
  const modalRef = useRef<HTMLDivElement | null>(null)

  const { data: categories } = useCategories()

  const { data: categoryProducts = [], isLoading } = useProductsByCategory(categorySlug || '')

  const { data: subcategories = [] } = useSubcategoriesByCategory(
    useMemo(() => {
      const found = categories?.find(c => c.slug === (categorySlug || ''))
      return found?.id || ''
    }, [categories, categorySlug])
  )

  useEffect(() => {
    if (isFilterModalOpen && modalRef.current) trapFocus(modalRef.current)
  }, [isFilterModalOpen, trapFocus])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (searchTerm) params.q = searchTerm
    if (sortBy) params.sort = sortBy
    if (viewMode) params.view = viewMode
    if (selectedSubcategories.length > 0) params.sub = selectedSubcategories.join(',')
    setSearchParams(params, { replace: true })
  }, [searchTerm, sortBy, viewMode, selectedSubcategories, setSearchParams])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedSubcategories, sortBy, pageSize])

  useEffect(() => {
    const fromQuery = searchParams.get('sub')
    const next = fromQuery ? fromQuery.split(',').filter(Boolean) : (subcategorySlug ? [subcategorySlug] : [])
    setSelectedSubcategories(next)
    setCurrentPage(1)
  }, [subcategorySlug, searchParams])

  const subcategoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    categoryProducts.forEach(p => {
      const id = String(p.subcategory?.id || p.subcategory_id || '')
      if (!id) return
      map.set(id, (map.get(id) || 0) + 1)
    })
    return map
  }, [categoryProducts])

  const filteredProducts: ProductWithCategory[] = useMemo(() => {
    let base = categoryProducts
    if (selectedSubcategories.length > 0) {
      const setIds = new Set(selectedSubcategories.map(String))
      base = base.filter(p => setIds.has(String(p.subcategory?.id || p.subcategory_id || '')))
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      base = base.filter(p => (p.name || '').toLowerCase().includes(q))
    }
    if (sortBy === 'name') {
      base = [...base].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    } else if (sortBy === 'recent') {
      base = [...base].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
    }
    return base
  }, [categoryProducts, selectedSubcategories, searchTerm, sortBy])

  const totalItems = filteredProducts.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const currentCategory = useMemo(() => categories?.find(c => c.slug === (categorySlug || '')) || null, [categories, categorySlug])
  const currentSubcategory = useMemo(() => {
    if (selectedSubcategories.length === 0) return null
    if (subcategorySlug) {
      const bySlug = subcategories.find(s => String(s.slug) === String(subcategorySlug))
      if (bySlug) return bySlug
    }
    const first = selectedSubcategories[0]
    return subcategories.find(s => String(s.id) === String(first) || String(s.slug) === String(first)) || null
  }, [subcategories, selectedSubcategories, subcategorySlug])

  const handleCategoryChange = (slug: string) => {
    if (!slug) return
    navigate(`/categorias/${slug}`)
    setSelectedSubcategories([])
    setCurrentPage(1)
  }

  const handleSubcategoryToggle = (id: string) => {
    setSelectedSubcategories(prev => {
      const set = new Set(prev)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      return Array.from(set)
    })
  }

  const applyFilters = () => {
    setIsFilterModalOpen(false)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedSubcategories([])
    setSortBy('name')
    setViewMode('grid')
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6 bg-white/70 backdrop-blur-sm rounded-full px-5 py-3 shadow-sm border border-gray-200/50" aria-label="breadcrumb">
          <Link to="/" className="hover:text-[#8B0000] transition-colors duration-200 font-medium">Início</Link>
          {currentCategory && (
            <>
              <span className="text-gray-400">/</span>
              <Link to={`/categorias/${currentCategory.slug}`} className="hover:text-[#8B0000] transition-colors duration-200 font-medium">
                {currentCategory.name}
              </Link>
            </>
          )}
          {currentSubcategory && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-[#333333] font-semibold truncate max-w-xs">{currentSubcategory.name}</span>
            </>
          )}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold text-gray-900">Filtros</span>
                </div>
                <button onClick={() => setIsFilterModalOpen(true)} className="lg:hidden text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
                  Abrir
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select id="category-select" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={categorySlug || ''} onChange={e => handleCategoryChange(e.target.value)} aria-label="Selecionar categoria">
                    <option value="">Selecione</option>
                    {categories?.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div role="group" aria-labelledby="subcat-label">
                  <div id="subcat-label" className="text-sm font-medium text-gray-700 mb-2">Subcategorias</div>
                  <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {subcategories.map(sub => {
                      const id = String(sub.id)
                      const isChecked = selectedSubcategories.includes(id) || selectedSubcategories.includes(sub.slug)
                      const count = subcategoryCounts.get(String(sub.id)) || 0
                      return (
                        <label key={sub.id} className="flex items-center justify-between gap-2 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={isChecked} onChange={() => handleSubcategoryToggle(id)} aria-checked={isChecked} aria-label={sub.name} />
                            <span className="text-sm text-gray-700">{sub.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">{count}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Busca</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input id="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar produto" className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" aria-label="Buscar produtos" />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Limpar</button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={applyFilters} className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Aplicar Filtros</button>
                  <button onClick={clearFilters} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Limpar</button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3" aria-live="polite">
                  <span className="text-sm text-gray-600">Mostrando {totalItems === 0 ? 0 : startIndex + 1} a {endIndex} de {totalItems} produtos</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Ordenar</label>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" aria-label="Ordenar resultados">
                    <option value="name">Nome (A–Z)</option>
                    <option value="recent">Mais recentes</option>
                  </select>
                  <div className="ml-3 flex items-center gap-1" role="group" aria-label="Alternar visualização">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} aria-pressed={viewMode === 'grid'} aria-label="Visualização em grade">
                      <Grid2x2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} aria-pressed={viewMode === 'list'} aria-label="Visualização em lista">
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                  <label className="ml-3 text-sm text-gray-700">Itens por página</label>
                  <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" aria-label="Itens por página">
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={36}>36</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: pageSize }).map((_, i) => (
                  <div key={i} className="h-60 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
                {paginatedProducts.map(product => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} onViewDetails={(p) => navigate(`/produto/${p.slug || p.id}`)} />
                ))}
                {paginatedProducts.length === 0 && (
                  <div className="text-center text-gray-600 py-10">Nenhum produto encontrado</div>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`} aria-disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>
              <span className="text-sm text-gray-700">Página {currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalItems === 0} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${currentPage === totalPages || totalItems === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`} aria-disabled={currentPage === totalPages || totalItems === 0}>
                <span>Próxima</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {isFilterModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true">
            <div ref={modalRef} className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold text-gray-900">Filtros</span>
                </div>
                <button onClick={() => setIsFilterModalOpen(false)} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">Fechar</button>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="m-category-select" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select id="m-category-select" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={categorySlug || ''} onChange={e => handleCategoryChange(e.target.value)}>
                    <option value="">Selecione</option>
                    {categories?.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div role="group" aria-labelledby="m-subcat-label">
                  <div id="m-subcat-label" className="text-sm font-medium text-gray-700 mb-2">Subcategorias</div>
                  <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {subcategories.map(sub => {
                      const id = String(sub.id)
                      const isChecked = selectedSubcategories.includes(id) || selectedSubcategories.includes(sub.slug)
                      const count = subcategoryCounts.get(String(sub.id)) || 0
                      return (
                        <label key={sub.id} className="flex items-center justify-between gap-2 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={isChecked} onChange={() => handleSubcategoryToggle(id)} />
                            <span className="text-sm text-gray-700">{sub.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">{count}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label htmlFor="m-search" className="block text-sm font-medium text-gray-700 mb-1">Busca</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input id="m-search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar produto" className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Limpar</button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={applyFilters} className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Aplicar Filtros</button>
                  <button onClick={clearFilters} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Limpar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryProducts

