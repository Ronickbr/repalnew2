import React from 'react'
import { Link } from 'react-router-dom'
import { useSubcategories } from '../hooks/useSubcategories'
import type { CategoryWithSubcategories, Subcategory } from '../hooks/useSubcategories'
import { Grid3X3, ChevronRight, Beef, Snowflake, ChefHat, Utensils, Package, Wrench, UtensilsCrossed } from 'lucide-react'

const CategoriesIndex: React.FC = () => {
  const { data, isLoading, isError, error } = useSubcategories()

  const categories: CategoryWithSubcategories[] = (data || []) as CategoryWithSubcategories[]

  const getIcon = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('açougue')) return Beef
    if (n.includes('refrigeração')) return Snowflake
    if (n.includes('padaria') || n.includes('confeitaria')) return ChefHat
    if (n.includes('bar') || n.includes('restaurante')) return Utensils
    if (n.includes('mobiliário')) return Package
    if (n.includes('peças')) return Wrench
    return UtensilsCrossed
  }

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

  if (!categories || categories.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <Link to="/" className="hover:text-red-700">Início</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-800 font-medium">Categorias</span>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
              <p className="text-gray-600">Nenhuma categoria disponível no momento.</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">Voltar para início</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <Link to="/" className="hover:text-red-700">Início</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-800 font-medium">Categorias</span>
            </nav>
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
            </div>
          </div>
          <div className="w-full max-w-md" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((category: CategoryWithSubcategories) => {
            const Icon = getIcon(category.name)
            return (
              <div key={category.id} className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 border border-red-100">
                      <Icon className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">{category.name}</h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 border border-gray-200">{category.subcategories?.length || 0} {category.subcategories?.length === 1 ? 'subcategoria' : 'subcategorias'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {category.subcategories?.slice(0, 6).map((sub: Subcategory) => (
                      <Link key={sub.id} to={`/categorias/${category.slug}?sub=${sub.id}`} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200">
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/categorias/${category.slug}`} className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">
                      Ver categoria
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link to="/" className="text-gray-600 hover:text-red-600">Início</Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CategoriesIndex
