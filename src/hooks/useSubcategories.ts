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
      console.log('Buscando subcategorias do banco de dados...')
      
      // Buscar todas as categorias ativas (não há subcategorias na estrutura atual)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          description,
          featured,
          active,
          created_at,
          updated_at
        `)
        .eq('active', true)
        .order('name', { ascending: true })

      if (categoriesError) {
        console.error('Erro ao buscar categorias:', categoriesError)
        throw categoriesError
      }

      // Como não há subcategorias, retornar categorias como "categorias com subcategorias vazias"
      const result = categoriesData?.map((category: any) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        subcategories: [] // Sem subcategorias por enquanto
      })) || []

      console.log('Categorias encontradas:', result.length)

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