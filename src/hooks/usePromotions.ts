import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Promotion } from '../lib/supabase';

export function usePromotions() {
  return useQuery({
    queryKey: ['active-promotions'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('active', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching promotions:', error);
        throw error;
      }

      return data as Promotion[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
