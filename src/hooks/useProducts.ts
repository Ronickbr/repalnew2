import { useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { queryKeys } from '../lib/react-query'
import { table } from '../lib/schema'
import type { ProductWithCategory } from '../types/product'

export interface SubcategoryWithId {
  id: number;
  name: string;
  slug: string;
  category_id: number;
}

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
      id: img.id,
      image_url: img.url,
      sort_order: img.sort_order ?? 0,
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
  } as ProductWithCategory;
};

export const useProducts = () => {
  const queryClient = useQueryClient();
  const query = useQuery<ProductWithCategory[]>({
    queryKey: queryKeys.products.all,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];

      const categoryMap = await fetchActiveCategoriesMap();

      const { data, error: productsError } = await supabase
        .from(table('products'))
        .select(`
          id,
          name,
          slug,
          description,
          specifications,
          category_id,
          subcategory_id,
          featured,
          featured_in_dropdown,
          is_disabled,
          featured_on_homepage,
          image,
          active,
          created_at,
          updated_at
        `)
        .eq('active', true);

      if (productsError) throw new Error(`Falha ao carregar produtos: ${productsError.message}`);

      return (data || []).map((p: any) => transformProductWithCategory(p, categoryMap));
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const fetchProducts = useCallback(() => {
    return queryClient.refetchQueries({ queryKey: queryKeys.products.all });
  }, [queryClient]);

  return useMemo(() => ({
    data: query.data ?? [],
    isLoading: query.isPending || query.isFetching,
    error: query.error?.message ?? null,
    refetch: fetchProducts,
  }), [query.data, query.isPending, query.isFetching, query.error, fetchProducts]);
};

export const useFeaturedProductsHome = () => {
  return useQuery<ProductWithCategory[]>({
    queryKey: queryKeys.products.homeFeatured,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];

      const categoryMap = await fetchActiveCategoriesMap();

      const { data, error: productsError } = await supabase
        .from(table('products'))
        .select(`
          id,
          name,
          slug,
          description,
          category_id,
          subcategory_id,
          featured,
          featured_in_dropdown,
          is_disabled,
          featured_on_homepage,
          image,
          created_at,
          updated_at
        `)
        .eq('active', true)
        .or('featured.eq.true,featured_on_homepage.eq.true')
        .order('featured_on_homepage', { ascending: false, nullsFirst: false })
        .order('featured', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(32);

      if (productsError) throw new Error(`Falha ao carregar produtos home: ${productsError.message}`);

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

export const useProductsBySubcategory = (subcategoryId: string | number, categoryId?: string | number) => {
  const { data: allProducts, isLoading, error } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!allProducts || !subcategoryId) return [];

    const subIdStr = String(subcategoryId);

    let filtered = allProducts.filter((product) => {
      if (typeof subcategoryId === 'string') {
        return product.subcategory?.slug === subcategoryId || String(product.subcategory_id) === subIdStr;
      }
      return String(product.subcategory_id) === subIdStr;
    });

    if (filtered.length === 0 && categoryId) {
      const catIdStr = String(categoryId);
      filtered = allProducts.filter((product) => {
        if (typeof categoryId === 'string') {
          return product.category?.slug === categoryId || String(product.category_id) === catIdStr;
        }
        return String(product.category_id) === catIdStr;
      });
    }

    return filtered;
  }, [allProducts, subcategoryId, categoryId]);

  return useMemo(() => ({
    data: filteredProducts,
    isLoading,
    error,
  }), [filteredProducts, isLoading, error]);
};

export const useProductsByCategory = (categoryId: string | number) => {
  const { data: allProducts, isLoading, error } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!allProducts || !categoryId) return [];

    const catIdStr = String(categoryId);

    return allProducts.filter((product) => {
      if (typeof categoryId === 'string') {
        return product.category?.slug === categoryId || String(product.category_id) === catIdStr;
      }
      return String(product.category_id) === catIdStr;
    });
  }, [allProducts, categoryId]);

  return useMemo(() => ({
    data: filteredProducts,
    isLoading,
    error,
  }), [filteredProducts, isLoading, error]);
};

export const useFeaturedProductByCategory = (categoryId: string | number) => {
  const { data: allProducts, isLoading, error } = useProducts();

  const featuredProduct = useMemo(() => {
    if (!allProducts) return null;

    const catIdStr = String(categoryId);

    const filtered = allProducts.filter((product) => {
      const match = typeof categoryId === 'string'
        ? product.category?.slug === categoryId || String(product.category_id) === catIdStr
        : String(product.category_id) === catIdStr;
      return match && product.featured_in_dropdown === true && !product.is_disabled;
    });

    return filtered.length > 0 ? filtered[0] : null;
  }, [allProducts, categoryId]);

  return useMemo(() => ({
    data: featuredProduct,
    isLoading,
    error,
  }), [featuredProduct, isLoading, error]);
};

export const useProductBySlug = (slug: string) => {
  return useQuery<ProductWithCategory | null>({
    queryKey: queryKeys.products.bySlug(slug),
    queryFn: async (): Promise<ProductWithCategory | null> => {
      if (!slug || !isSupabaseConfigured) return null;

      const baseSelect = `
        *,
        product_images (
          id,
          url,
          sort_order,
          created_at
        )
      `;

      let candidate: any = null;

      const { data: exact, error: exactErr } = await supabase
        .from(table('products'))
        .select(baseSelect)
        .eq('active', true)
        .eq('slug', slug)
        .maybeSingle();

      if (exactErr) {
        console.warn('[useProductBySlug] exact slug query warning:', exactErr.message);
      }

      candidate = exact ?? null;

      if (!candidate) {
        const { data: byILike } = await supabase
          .from(table('products'))
          .select(baseSelect)
          .eq('active', true)
          .ilike('slug', slug)
          .limit(1)
          .maybeSingle();
        if (byILike) candidate = byILike;
      }

      if (!candidate) {
        const numId = Number(slug);
        if (!Number.isNaN(numId)) {
          const { data: byId } = await supabase
            .from(table('products'))
            .select(baseSelect)
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
  const { data: allProducts, isLoading, error } = useProducts();

  const featuredProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter((product) => product.featured_in_dropdown === true && !product.is_disabled);
  }, [allProducts]);

  return useMemo(() => ({
    data: featuredProducts,
    isLoading,
    error,
  }), [featuredProducts, isLoading, error]);
};

export const useFeaturedProductsByCategory = (categoryId: string | number) => {
  const { data: allProducts, isLoading, error } = useProductsByCategory(categoryId);

  const featuredProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter((product) => product.featured_in_dropdown === true && !product.is_disabled);
  }, [allProducts, categoryId]);

  return useMemo(() => ({
    data: featuredProducts,
    isLoading,
    error,
  }), [featuredProducts, isLoading, error]);
};

export const useLatestProducts = (limit: number = 6) => {
  return useQuery<ProductWithCategory[]>({
    queryKey: ['products', 'latest', limit],
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];

      const categoryMap = await fetchActiveCategoriesMap();

      const { data, error: productsError } = await supabase
        .from(table('products'))
        .select(`
          id,
          name,
          slug,
          description,
          image,
          category_id,
          featured,
          featured_in_dropdown,
          is_disabled,
          featured_on_homepage,
          created_at,
          updated_at
        `)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

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
    queryKey: ['products', 'similar', String(currentProductId), categoryId != null ? String(categoryId) : 'nocat', limit],
    queryFn: async () => {
      if (!categoryId || !isSupabaseConfigured) return [];

      const categoryMap = await fetchActiveCategoriesMap();

      const { data, error: productsError } = await supabase
        .from(table('products'))
        .select(`
          id,
          name,
          slug,
          description,
          category_id,
          subcategory_id,
          featured,
          featured_in_dropdown,
          is_disabled,
          featured_on_homepage,
          image,
          created_at,
          updated_at
        `)
        .eq('active', true)
        .eq('category_id', categoryId)
        .neq('id', currentProductId)
        .order('created_at', { ascending: false })
        .limit(limit);

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
        q = q.eq('parent_id', categoryId);
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
