import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSubcategories } from '../hooks/useSubcategories'
import type { CategoryWithSubcategories, Subcategory } from '../hooks/useSubcategories'

const CategoriesIndex: React.FC = () => {
  const { data, isLoading, isError, error } = useSubcategories()
  const [searchParams] = useSearchParams()
  const busca = (searchParams.get('busca') || '').trim().toLowerCase()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#8B0000' }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar categorias</h1>
          <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : 'Tente novamente mais tarde.'}</p>
          <Link to="/" className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">Voltar para início</Link>
        </div>
      </div>
    )
  }

  const categories: CategoryWithSubcategories[] = (data || []) as CategoryWithSubcategories[]
  const filtered = busca
    ? categories.filter((c: CategoryWithSubcategories) => c.name?.toLowerCase().includes(busca))
    : categories

  if (!filtered || filtered.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
            <p className="text-gray-600">Nenhuma categoria disponível no momento.</p>
          </div>
          <Link to="/" className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">Voltar para início</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
          {busca && (
            <p className="text-sm text-gray-600">Resultado para "{busca}"</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((category: CategoryWithSubcategories) => (
            <div key={category.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition-all overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{category.name}</h2>
                <p className="text-sm text-gray-600 mb-4">{category.subcategories?.length || 0} {category.subcategories?.length === 1 ? 'subcategoria' : 'subcategorias'}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {category.subcategories?.slice(0, 6).map((sub: Subcategory) => (
                    <Link key={sub.id} to={`/categorias/${category.slug}?sub=${sub.id}`} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200">
                      {sub.name}
                    </Link>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/categorias/${category.slug}`} className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">Ver categoria</Link>
                  <Link to="/" className="text-gray-600 hover:text-red-600">Início</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CategoriesIndex
