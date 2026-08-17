import { useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { queryKeys, type ProductFilters } from '../lib/react-query'
import { table } from '../lib/schema'
import type { ProductWithCategory } from '../types/product'

export interface SubcategoryWithId {
  id: number;
  name: string;
  slug: string;
  category_id: number;
}

export const PAGE_SIZE = 24;

const PRODUCT_CARD_FIELDS = `
  id,
  name,
  slug,
  short_description,
  category_id,
  subcategory_id,
  image,
  brand,
  featured,
  featured_on_homepage,
  featured_in_dropdown,
  is_disabled,
  active,
  created_at,
  updated_at
`;

const PRODUCT_DETAIL_FIELDS = `
  id,
  name,
  slug,
  description,
  specifications,
  technical_specifications,
  short_description,
  key_features,
  category_id,
  subcategory_id,
  brand,
  model,
  sku_code,
  image,
  active,
  updated_at,
  product_images(id, url, sort_order, alt_text, created_at)
`;

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

interface RawCategory {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  active?: boolean;
}

const fetchActiveCategoriesMap = async (): Promise<Map<number, RawCategory>> => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, active')
    .eq('active', true);

  if (error) throw error;

  const map = new Map<number, RawCategory>();
  (data || []).forEach((cat: RawCategory) => map.set(cat.id, cat));
  return map;
};

const transformProductWithCategory = (
  raw: any,
  categoryMap: Map<number, RawCategory>,
  opts?: { useRawImages?: boolean }
): ProductWithCategory => {
  const subcategory = raw.subcategory_id ? categoryMap.get(raw.subcategory_id) : undefined;
  const directCategory = raw.category_id ? categoryMap.get(raw.category_id) : undefined;
  const parentCategory = subcategory?.parent_id
    ? categoryMap.get(subcategory.parent_id) ?? directCategory
    : directCategory;

  let productImages: ProductWithCategory['product_images'] = [];

  if (opts?.useRawImages && raw.product_images && Array.isArray(raw.product_images)) {
    productImages = raw.product_images.map((img: any) => ({
      id: String(img.id),
      image_url: img.url,
      sort_order: img.sort_order ?? 0,
      alt_text: img.alt_text ?? undefined,
      created_at: img.created_at ?? new Date().toISOString(),
    }));
  } else if (raw.image) {
    productImages = [
      {
        id: '1',
        image_url: raw.image,
        sort_order: 1,
      },
    ];
  }

  const toCat = (c: RawCategory | undefined) => {
    if (!c) return undefined;
    return {
      id: String(c.id),
      name: c.name,
      slug: c.slug,
    };
  };

  const extraFields: any = {};
  if (raw.short_description) extraFields.short_description = raw.short_description;
  if (raw.key_features) extraFields.key_features = raw.key_features;
  if (raw.technical_specifications) extraFields.technical_specifications = raw.technical_specifications;
  if (raw.brand) extraFields.brand = raw.brand;
  if (raw.model) extraFields.model = raw.model;
  if (raw.sku_code) extraFields.sku_code = raw.sku_code;

  return {
    id: String(raw.id),
    name: raw.name || 'Produto',
    slug: raw.slug || generateSlug(raw.name || ''),
    description: raw.description || undefined,
    specifications: raw.specifications || undefined,
    category_id: raw.category_id != null ? String(raw.category_id) : undefined,
    subcategory_id: raw.subcategory_id != null ? String(raw.subcategory_id) : undefined,
    featured: raw.featured || false,
    featured_in_dropdown: raw.featured_in_dropdown || false,
    is_disabled: raw.is_disabled || false,
    featured_on_homepage: raw.featured_on_homepage || false,
    active: raw.active !== undefined ? !!raw.active : true,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
    category: toCat(parentCategory),
    subcategory: toCat(subcategory),
    product_images: productImages,
    image_url: raw.image || undefined,
    ...extraFields,
  } as ProductWithCategory;
};

export const useProducts = () => {
  const queryClient = useQueryClient();
  const page1Filters: ProductFilters = {};
  const firstPage = useProductsPage(1, page1Filters);

  const fetchProducts = useCallback(() => {
    return queryClient.refetchQueries({ queryKey: queryKeys.products.all });
  }, [queryClient]);

  return useMemo(() => ({
    data: firstPage.data?.data ?? [],
    isLoading: firstPage.isLoading,
    error: firstPage.error,
    refetch: fetchProducts,
  }), [firstPage.data, firstPage.isLoading, firstPage.error, fetchProducts]);
};

export const useAllProductsByCategory = (categoryId: string | number) => {
  return useQuery<ProductWithCategory[]>({
    queryKey: ['products', 'all-by-category', String(categoryId)],
    queryFn: async (): Promise<ProductWithCategory[]> => {
      if (!categoryId || !isSupabaseConfigured) return [];

      const categoryMap = await fetchActiveCategoriesMap();

      let numericCategoryId: number | null = null;
      if (typeof categoryId === 'number') {
        numericCategoryId = categoryId;
      } else {
        for (const [id, cat] of categoryMap.entries()) {
          if (cat.slug === categoryId) {
            numericCategoryId = id;
            break;
          }
        }
      }

      let request = supabase
        .from(table('products'))
        .select(PRODUCT_CARD_FIELDS)
        .eq('active', true)
        .eq('is_disabled', false)
        .order('created_at', { ascending: false })
        .limit(600);

      if (numericCategoryId != null) {
        request = request.eq('category_id', numericCategoryId);
      }

      const { data, error } = await request;
      if (error) throw new Error(`Falha ao carregar produtos da categoria: ${error.message}`);

      return (data || []).map((p: any) => transformProductWithCategory(p, categoryMap));
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    enabled: !!categoryId,
  });
};

export const useAllProductsBySubcategory = (subcategoryId: string | number) => {
  return useQuery<ProductWithCategory[]>({
    queryKey: ['products', 'all-by-subcategory', String(subcategoryId)],
    queryFn: async (): Promise<ProductWithCategory[]> => {
      if (!subcategoryId || !isSupabaseConfigured) return [];

      const categoryMap = await fetchActiveCategoriesMap();

      let numericSubcategoryId: number | null = null;
      if (typeof subcategoryId === 'number') {
        numericSubcategoryId = subcategoryId;
      } else {
        for (const [id, cat] of categoryMap.entries()) {
          if (cat.slug === subcategoryId) {
            numericSubcategoryId = id;
            break;
          }
        }
      }

      let request = supabase
        .from(table('products'))
        .select(PRODUCT_CARD_FIELDS)
        .eq('active', true)
        .eq('is_disabled', false)
        .order('created_at', { ascending: false })
        .limit(600);

      if (numericSubcategoryId != null) {
        request = request.eq('subcategory_id', numericSubcategoryId);
      }

      const { data, error } = await request;
      if (error) throw new Error(`Falha ao carregar produtos da subcategoria: ${error.message}`);

      return (data || []).map((p: any) => transformProductWithCategory(p, categoryMap));
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    enabled: !!subcategoryId,
  });
};

export function useProductsPage(page: number = 1, filters: ProductFilters = {}) {
  return useQuery<{ data: ProductWithCategory[]; count: number | null }>({
    queryKey: queryKeys.products.page(page, filters),
    queryFn: async () => {
      if (!isSupabaseConfigured) return { data: [], count: 0 };

      const categoryMap = await fetchActiveCategoriesMap();
      const p = Math.max(1, page);
      const from = (p - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let request = supabase
        .from(table('products'))
        .select(PRODUCT_CARD_FIELDS, { count: 'exact' })
        .eq('active', true)
        .eq('is_disabled', false)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.category_id != null) {
        request = request.eq('category_id', filters.category_id);
      }
      if (filters.subcategory_id != null) {
        request = request.eq('subcategory_id', filters.subcategory_id);
      }

      const { data, count, error: productsError } = await request;

      if (productsError) throw new Error(`Falha ao carregar produtos: ${productsError.message}`);

      return {
        data: (data || []).map((pItem: any) => transformProductWithCategory(pItem, categoryMap)),
        count,
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

export function useProductsByCategory(categoryId: string | number, page: number = 1) {
  return useQuery<{ data: ProductWithCategory[]; count: number | null }>({
    queryKey: queryKeys.products.byCategory(categoryId, page),
    queryFn: async () => {
      if (!categoryId || !isSupabaseConfigured) return { data: [], count: 0 };

      const categoryMap = await fetchActiveCategoriesMap();

      let numericCategoryId: number | null = null;
      if (typeof categoryId === 'number') {
        numericCategoryId = categoryId;
      } else {
        for (const [id, cat] of categoryMap.entries()) {
          if (cat.slug === categoryId) {
            numericCategoryId = id;
            break;
          }
        }
      }

      const p = Math.max(1, page);
      const from = (p - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let request = supabase
        .from(table('products'))
        .select(PRODUCT_CARD_FIELDS, { count: 'exact' })
        .eq('active', true)
        .eq('is_disabled', false)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (numericCategoryId != null) {
        request = request.eq('category_id', numericCategoryId);
      }

      const { data, count, error: productsError } = await request;

      if (productsError) throw new Error(`Falha ao carregar produtos da categoria: ${productsError.message}`);

      return {
        data: (data || []).map((pItem: any) => transformProductWithCategory(pItem, categoryMap)),
        count,
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    enabled: !!categoryId,
  });
}

export function useProductsBySubcategory(subcategoryId: string | number, page: number = 1) {
  return useQuery<{ data: ProductWithCategory[]; count: number | null }>({
    queryKey: queryKeys.products.bySubcategory(subcategoryId, page),
    queryFn: async () => {
      if (!subcategoryId || !isSupabaseConfigured) return { data: [], count: 0 };

      const categoryMap = await fetchActiveCategoriesMap();

      let numericSubcategoryId: number | null = null;
      if (typeof subcategoryId === 'number') {
        numericSubcategoryId = subcategoryId;
      } else {
        for (const [id, cat] of categoryMap.entries()) {
          if (cat.slug === subcategoryId) {
            numericSubcategoryId = id;
            break;
          }
        }
      }

      const p = Math.max(1, page);
      const from = (p - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let request = supabase
        .from(table('products'))
        .select(PRODUCT_CARD_FIELDS, { count: 'exact' })
        .eq('active', true)
        .eq('is_disabled', false)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (numericSubcategoryId != null) {
        request = request.eq('subcategory_id', numericSubcategoryId);
      }

      const { data, count, error: productsError } = await request;

      if (productsError) throw new Error(`Falha ao carregar produtos da subcategoria: ${productsError.message}`);

      return {
        data: (data || []).map((pItem: any) => transformProductWithCategory(pItem, categoryMap)),
        count,
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    enabled: !!subcategoryId,
  });
}

export const useFeaturedProductsHome = () => {
  return useQuery<ProductWithCategory[]>({
    queryKey: queryKeys.products.homeFeatured,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];

      const categoryMap = await fetchActiveCategoriesMap();

      const { data, error: productsError } = await supabase
        .from(table('products'))
        .select(PRODUCT_CARD_FIELDS)
        .eq('active', true)
        .eq('is_disabled', false)
        .or('featured.eq.true,featured_on_homepage.eq.true')
        .order('featured_on_homepage', { ascending: false, nullsFirst: false })
        .order('featured', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(8);

      if (productsError) throw new Error(`Falha ao carregar produtos home: ${productsError.message}`);

      return (data || []).map((p: any) => transformProductWithCategory(p, categoryMap));
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};

export const useFeaturedProductByCategory = (categoryId: string | number) => {
  return useQuery<ProductWithCategory | null>({
    queryKey: ['products', 'featured-by-category', String(categoryId)],
    queryFn: async () => {
      if (!categoryId || !isSupabaseConfigured) return null;

      const categoryMap = await fetchActiveCategoriesMap();

      let numericCategoryId: number | null = null;
      if (typeof categoryId === 'number') {
        numericCategoryId = categoryId;
      } else {
        for (const [id, cat] of categoryMap.entries()) {
          if (cat.slug === categoryId) {
            numericCategoryId = id;
            break;
          }
        }
      }

      if (numericCategoryId == null) return null;

      const { data, error } = await supabase
        .from(table('products'))
        .select(PRODUCT_CARD_FIELDS)
        .eq('active', true)
        .eq('is_disabled', false)
        .eq('category_id', numericCategoryId)
        .eq('featured_in_dropdown', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw new Error(`Falha ao carregar destaque da categoria: ${error.message}`);

      return (data && data.length > 0) ? transformProductWithCategory(data[0], categoryMap) : null;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    enabled: !!categoryId,
  });
};

export const useProductBySlug = (slug: string) => {
  return useQuery<ProductWithCategory | null>({
    queryKey: queryKeys.products.bySlug(slug),
    queryFn: async (): Promise<ProductWithCategory | null> => {
      if (!slug || !isSupabaseConfigured) return null;

      let candidate: any = null;

      const { data: exact, error: exactErr } = await supabase
        .from(table('products'))
        .select(PRODUCT_DETAIL_FIELDS)
        .eq('active', true)
        .eq('slug', slug)
        .maybeSingle();

      if (exactErr) {
        console.warn('[useProductBySlug] exact slug query warning:', exactErr.message);
      }

      candidate = exact ?? null;

      if (!candidate) {
        const numId = Number(slug);
        if (!Number.isNaN(numId)) {
          const { data: byId } = await supabase
            .from(table('products'))
            .select(PRODUCT_DETAIL_FIELDS)
            .eq('active', true)
            .eq('id', numId)
            .maybeSingle();
          if (byId) candidate = byId;
        }
      }

      if (!candidate) return null;

      let productCategory: RawCategory | null = null;
      if (candidate.category_id) {
        const { data: categoryData, error: catErr } = await supabase
          .from('categories')
          .select('id, name, slug, parent_id, active')
          .eq('id', candidate.category_id)
          .maybeSingle();

        if (catErr) {
          console.warn('[useProductBySlug] categoria query warning:', catErr.message);
        }
        productCategory = (categoryData as RawCategory) ?? null;
      }

      const categoryMap = new Map<number, RawCategory>();
      if (productCategory) categoryMap.set(productCategory.id, productCategory);

      const processed = transformProductWithCategory(candidate, categoryMap, { useRawImages: true });

      if (productCategory) {
        processed.category = {
          id: String(productCategory.id),
          name: productCategory.name,
          slug: productCategory.slug,
        };
      }

      return processed;
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    enabled: !!slug,
  });
};

export const useFeaturedDropdownProducts = () => {
  return useQuery<ProductWithCategory[]>({
    queryKey: queryKeys.products.dropdownFeatured,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];

      const categoryMap = await fetchActiveCategoriesMap();

      const { data, error } = await supabase
        .from(table('products'))
        .select(PRODUCT_CARD_FIELDS)
        .eq('active', true)
        .eq('is_disabled', false)
        .eq('featured_in_dropdown', true)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Falha ao carregar destaque dropdown: ${error.message}`);

      return (data || []).map((p: any) => transformProductWithCategory(p, categoryMap));
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};

export const useFeaturedProductsByCategory = (categoryId: string | number) => {
  return useQuery<ProductWithCategory[]>({
    queryKey: ['products', 'featured-list', String(categoryId)],
    queryFn: async () => {
      if (!categoryId || !isSupabaseConfigured) return [];

      const categoryMap = await fetchActiveCategoriesMap();

      let numericCategoryId: number | null = null;
      if (typeof categoryId === 'number') {
        numericCategoryId = categoryId;
      } else {
        for (const [id, cat] of categoryMap.entries()) {
          if (cat.slug === categoryId) {
            numericCategoryId = id;
            break;
          }
        }
      }

      if (numericCategoryId == null) return [];

      const { data, error } = await supabase
        .from(table('products'))
        .select(PRODUCT_CARD_FIELDS)
        .eq('active', true)
        .eq('is_disabled', false)
        .eq('category_id', numericCategoryId)
        .eq('featured_in_dropdown', true)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Falha ao carregar destaques da categoria: ${error.message}`);

      return (data || []).map((p: any) => transformProductWithCategory(p, categoryMap));
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    enabled: !!categoryId,
  });
};

export const useLatestProducts = (limit: number = 6) => {
  return useQuery<ProductWithCategory[]>({
    queryKey: queryKeys.products.latest(limit),
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];

      const categoryMap = await fetchActiveCategoriesMap();

      const { data, error: productsError } = await supabase
        .from(table('products'))
        .select(PRODUCT_CARD_FIELDS)
        .eq('active', true)
        .eq('is_disabled', false)
        .order('created_at', { ascending: false })
        .limit(Math.max(1, limit));

      if (productsError) throw new Error(`Falha ao carregar produtos recentes: ${productsError.message}`);

      return (data || []).map((p: any) => transformProductWithCategory(p, categoryMap));
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};

export const useSimilarProducts = (
  currentProductId: string | number,
  categoryId: string | number | null | undefined,
  limit: number = 4
) => {
  return useQuery<ProductWithCategory[]>({
    queryKey: queryKeys.products.similar(currentProductId, categoryId ?? null, limit),
    queryFn: async () => {
      if (!categoryId || !isSupabaseConfigured) return [];

      const categoryMap = await fetchActiveCategoriesMap();

      let numericCategoryId: number | null = null;
      if (typeof categoryId === 'number') {
        numericCategoryId = categoryId;
      } else if (typeof categoryId === 'string') {
        for (const [id, cat] of categoryMap.entries()) {
          if (cat.slug === categoryId) {
            numericCategoryId = id;
            break;
          }
        }
        if (numericCategoryId == null) {
          const parsed = Number(categoryId);
          if (!Number.isNaN(parsed)) numericCategoryId = parsed;
        }
      }

      if (numericCategoryId == null) return [];

      const { data, error: productsError } = await supabase
        .from(table('products'))
        .select(PRODUCT_CARD_FIELDS)
        .eq('active', true)
        .eq('is_disabled', false)
        .eq('category_id', numericCategoryId)
        .neq('id', currentProductId)
        .order('created_at', { ascending: false })
        .limit(Math.max(1, limit));

      if (productsError) throw new Error(`Falha ao carregar produtos similares: ${productsError.message}`);

      return (data || []).map((p: any) => transformProductWithCategory(p, categoryMap));
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    enabled: !!categoryId,
  });
};

export const useSubcategories = (categoryId?: string | number) => {
  return useQuery<SubcategoryWithId[]>({
    queryKey: ['subcategories', categoryId != null ? String(categoryId) : 'all'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];

      let q = supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .not('parent_id', 'is', null)
        .eq('active', true);

      if (categoryId) {
        if (typeof categoryId === 'number') {
          q = q.eq('parent_id', categoryId);
        } else {
          q = q.or(`parent_id.eq.${categoryId}`);
        }
      }

      const { data, error: subError } = await q.order('name');

      if (subError) throw new Error(`Falha ao carregar subcategorias: ${subError.message}`);

      return (data || []).map((subcat: any) => ({
        id: subcat.id,
        name: subcat.name,
        slug: subcat.slug,
        category_id: subcat.parent_id,
      }));
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};

export default useProducts;
