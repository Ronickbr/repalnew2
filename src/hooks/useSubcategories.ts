import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'



export interface Subcategory {
  id: number
  name: string
  slug: string
  category_id: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CategoryWithSubcategories {
  id: number
  name: string
  slug: string
  subcategories: Subcategory[]
}

export const useSubcategories = () => {
  return useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => {
      console.log('=== DEBUG useSubcategories ===')
      console.log('Buscando categorias hierárquicas do banco de dados...')
      
      // Buscar todas as categorias (principais e subcategorias) ativas
      const { data: allCategoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          parent_id,
          is_active
        `)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (categoriesError) {
        console.error('Erro ao buscar categorias:', categoriesError)
        throw categoriesError
      }

      console.log('=== DEBUG useSubcategories ===')
      console.log('Total de categorias retornadas:', allCategoriesData?.length || 0)
      
      // Separar categorias principais (parent_id = NULL) de subcategorias
      const mainCategories = allCategoriesData?.filter((cat: any) => cat.parent_id === null) || []
      const subcategories = allCategoriesData?.filter((cat: any) => cat.parent_id !== null) || []
      
      console.log('Categorias principais:', mainCategories.length)
      console.log('Subcategorias:', subcategories.length)
      console.log('Subcategorias por categoria:')
      subcategories.forEach((sub: any) => {
        console.log(`- ${sub.name} (parent_id: ${sub.parent_id})`)
      })

      // Combinar categorias principais com suas subcategorias
      const result = mainCategories.map((category: any) => {
        const categorySubcategories = subcategories.filter(
          (sub: any) => sub.parent_id === category.id
        ) || []

        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          subcategories: categorySubcategories.map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug
          }))
        }
      }) || []

      console.log('Resultado final:', result)
      return result
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  })
}

// Hook para buscar subcategorias de uma categoria específica
export const useSubcategoriesByCategory = (categoryId: number) => {
  return useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: async () => {
      console.log(`Buscando subcategorias para categoria ${categoryId}...`)
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', categoryId)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('Erro ao buscar subcategorias por categoria:', error)
        throw error
      }

      console.log(`Subcategorias encontradas para categoria ${categoryId}:`, data?.length || 0)
      return data as Subcategory[]
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}