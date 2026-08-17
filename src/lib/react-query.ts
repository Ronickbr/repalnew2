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

export interface ProductFilters {
  category_id?: number | string;
  subcategory_id?: number | string;
  search?: string;
  sort?: string;
}

// Query keys para organização
export const queryKeys = {
  categories: ['categories'] as const,
  products: {
    all: ['products'] as const,
    page: (page: number, filters: ProductFilters) =>
      ['products', 'page', page, filters] as const,
    byCategory: (categoryId: number | string, page: number = 1) =>
      ['products', 'category', categoryId, page] as const,
    bySubcategory: (subcategoryId: number | string, page: number = 1) =>
      ['products', 'subcategory', subcategoryId, page] as const,
    bySlug: (slug: string) => ['products', 'slug', slug] as const,
    featured: ['products', 'featured'] as const,
    homeFeatured: ['products', 'home-featured'] as const,
    latest: (limit: number = 6) => ['products', 'latest', limit] as const,
    similar: (productId: string | number, categoryId: number | string | null, limit: number = 4) =>
      ['products', 'similar', String(productId), categoryId != null ? String(categoryId) : 'nocat', limit] as const,
    search: (query: string) => ['products', 'search', query] as const,
    dropdownFeatured: ['products', 'dropdown-featured'] as const,
  },
  siteSettings: ['site_settings'] as const,
  leads: ['leads'] as const,
} as const