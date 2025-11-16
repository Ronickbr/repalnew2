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
      console.log('Buscando categorias e subcategorias do banco de dados...')
      
      // Buscar todas as categorias ativas
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug
        `)
        .eq('active', true)
        .order('name', { ascending: true })

      if (categoriesError) {
        console.error('Erro ao buscar categorias:', categoriesError)
        throw categoriesError
      }

      // Buscar todas as subcategorias ativas
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select(`
          id,
          name,
          slug,
          category_id,
          is_active
        `)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (subcategoriesError) {
        console.error('Erro ao buscar subcategorias:', subcategoriesError)
        throw subcategoriesError
      }

      // Combinar categorias com suas subcategorias
      const result = categoriesData?.map((category: any) => {
        const categorySubcategories = subcategoriesData?.filter(
          (sub: any) => sub.category_id === category.id
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
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
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