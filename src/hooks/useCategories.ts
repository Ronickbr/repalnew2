import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { table } from '../lib/schema'
import { queryKeys } from '../lib/react-query'
import type { Category } from '../lib/supabase'

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async (): Promise<Category[]> => {
      
      const { data, error } = await supabase
        .from(table('categories'))
        .select('*')
        .is('parent_id', null) // Buscar apenas categorias principais
        .eq('active', true)
        .order('sort_order', { ascending: true })
      
      if (error) {
        console.error('❌ useCategories: Erro ao buscar categorias:', error);
        throw new Error(`Erro ao buscar categorias: ${error.message}`)
      }
      
      
      return data || []
    },
  })
}

// Hook para buscar subcategorias de uma categoria específica
export function useSubcategoriesByCategory(parentId: string | number) {
  return useQuery({
    queryKey: [...queryKeys.categories, 'subcategories', parentId],
    queryFn: async (): Promise<Category[]> => {
      
      const { data, error } = await supabase
        .from(table('categories'))
        .select('*')
        .eq('parent_id', parentId)
        .eq('active', true)
        .order('sort_order', { ascending: true })
      
      if (error) {
        console.error('❌ useSubcategoriesByCategory: Erro ao buscar subcategorias:', error);
        throw new Error(`Erro ao buscar subcategorias: ${error.message}`)
      }
      
      
      return data || []
    },
    enabled: !!parentId,
  })
}
