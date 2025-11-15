import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { table } from '../lib/schema'
import { queryKeys } from '../lib/react-query'
import type { Category } from '../lib/supabase'

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async (): Promise<Category[]> => {
      console.log('🔍 useCategories: Buscando categorias...');
      const { data, error } = await supabase
        .from(table('categories'))
        .select('*')
        .order('sort_order', { ascending: true })
      
      if (error) {
        console.error('❌ useCategories: Erro ao buscar categorias:', error);
        throw new Error(`Erro ao buscar categorias: ${error.message}`)
      }
      
      console.log('✅ useCategories: Categorias carregadas:', data?.length || 0, 'categorias');
      console.log('📋 useCategories: Dados das categorias:', data);
      return data || []
    },
  })
}