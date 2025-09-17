import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Query keys para organização
export const queryKeys = {
  categories: ['categories'] as const,
  products: {
    all: ['products'] as const,
    byCategory: (categorySlug: string) => ['products', 'category', categorySlug] as const,
    bySlug: (slug: string) => ['products', 'slug', slug] as const,
    featured: ['products', 'featured'] as const,
    search: (query: string) => ['products', 'search', query] as const,
  },
  leads: ['leads'] as const,
} as const