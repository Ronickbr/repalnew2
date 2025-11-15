import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { table } from '../lib/schema'
import type { ProductWithCategory } from '../types/product'

// Cache global para evitar múltiplas requisições
let productsCache: ProductWithCategory[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
let isFetching = false
let fetchPromise: Promise<void> | null = null

export const useProducts = () => {
  const [products, setProducts] = useState<ProductWithCategory[]>(productsCache || [])
  const [isLoading, setIsLoading] = useState(!productsCache)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    // Verificar se o cache ainda é válido
    const now = Date.now()
    if (productsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setProducts(productsCache)
      setIsLoading(false)
      return
    }

    // Evitar múltiplas requisições simultâneas
    if (isFetching && fetchPromise) {
      await fetchPromise
      return
    }

    // Criar promise única para múltiplos chamadores
    fetchPromise = (async () => {
      try {
        isFetching = true
        setIsLoading(true);
        setError(null);
        
        // Buscar produtos com join duplo na tabela categories para obter categoria e subcategoria
        const { data: productsData, error: productsError } = await supabase
          .from(table('products'))
          .select(`
            id,
            name,
            description,
            benefits,
            category_id,
            subcategory_id,
            featured,
            featured_in_dropdown,
            is_disabled,
            featured_on_homepage,
            clearance_sale,
            image,
            category:categories!fk_products_category(
              id,
              name,
              slug
            ),
            subcategory:subcategories!fk_products_subcategory(
              id,
              name,
              slug
            )
          `)
          .eq('active', true);
        
        if (productsError) {
          throw new Error(`Falha ao carregar produtos: ${productsError.message}`);
        }
        
        // Transformar os dados para manter compatibilidade com a interface existente
        const transformedProducts: ProductWithCategory[] = (productsData || []).map((product: any) => ({
          id: product.id,
          product_name: product.name,
          description: product.description || undefined,
          category_id: product.category_id,
          subcategory_id: product.subcategory_id,
          slug: generateSlug(product.name),
          featured: product.featured || false,
          featured_in_dropdown: product.featured_in_dropdown || false,
          is_disabled: product.is_disabled || false,
          featured_on_homepage: product.featured_on_homepage || false,
          clearance_sale: product.clearance_sale || false,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category: Array.isArray(product.category) ? undefined : product.category,
          subcategory: Array.isArray(product.subcategory) ? undefined : product.subcategory,
          product_images: product.image ? [{ 
            id: '1', 
            product_id: product.id, 
            image_url: product.image, 
            sort_order: 1, 
            created_at: new Date().toISOString() 
          }] : []
        }));
        
        // Atualizar cache
        productsCache = transformedProducts
        cacheTimestamp = now
        
        setProducts(transformedProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
        isFetching = false
        fetchPromise = null
      }
    })()

    await fetchPromise
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);



  const memoizedProducts = useMemo(() => products, [products])

  return useMemo(() => ({
    data: memoizedProducts,
    isLoading,
    error,
    refetch: fetchProducts
  }), [memoizedProducts, isLoading, error, fetchProducts]);
};

export const useProductsByCategory = (categoryId: string | number) => {
  const { data: allProducts, isLoading, error } = useProducts()
  
  const filteredProducts = useMemo(() => {
    if (!allProducts || !categoryId) return []
    
    console.log('🔍 useProductsByCategory: Filtrando produtos para categoria:', categoryId)
    console.log('📦 useProductsByCategory: Total de produtos disponíveis:', allProducts.length)
    
    // Se categoryId for string (slug), filtrar por category.slug
    if (typeof categoryId === 'string') {
      const filtered = allProducts.filter(product => {
        const productCategorySlug = product.category?.slug
        console.log('🏷️ Produto:', product.product_name, 'Category Slug:', productCategorySlug, 'Buscando:', categoryId)
        return productCategorySlug === categoryId
      })
      console.log('✅ useProductsByCategory: Produtos filtrados por slug:', filtered.length)
      return filtered
    }
    
    // Se categoryId for number (id), filtrar por category.id
    const filtered = allProducts.filter(product => {
      const productCategoryId = product.category?.id
      console.log('🏷️ Produto:', product.product_name, 'Category ID:', productCategoryId, 'Buscando:', categoryId)
      return productCategoryId === String(categoryId)
    })
    console.log('✅ useProductsByCategory: Produtos filtrados por ID:', filtered.length)
    return filtered
  }, [allProducts, categoryId])
  
  return useMemo(() => ({
    data: filteredProducts,
    isLoading,
    error
  }), [filteredProducts, isLoading, error])
}

export const useFeaturedProductByCategory = (categoryId: string | number) => {
  const { data: allProducts, isLoading, error } = useProducts()
  
  const featuredProduct = useMemo(() => {
    console.log('🎯 useFeaturedProductByCategory: Iniciando busca para categoria', categoryId, 'tipo:', typeof categoryId)
    
    if (!allProducts) {
      console.log('🎯 useFeaturedProductByCategory: allProducts é null')
      return null
    }
    
    console.log('🎯 useFeaturedProductByCategory: Filtrando produtos em destaque para categoria', categoryId)
    console.log('📦 useFeaturedProductByCategory: Total de produtos disponíveis:', allProducts.length)
    
    // Verificar todos os produtos com featured_in_dropdown=true (para debug)
    const allFeaturedProducts = allProducts.filter(product => product.featured_in_dropdown === true)
    console.log('🔍 Todos os produtos com featured_in_dropdown=true:', allFeaturedProducts.length)
    allFeaturedProducts.forEach(p => {
      console.log(`  - ${p.product_name}: categoria=${p.category?.name} (${p.category?.id}), slug=${p.category?.slug}`)
    })
    
    // Filtrar produtos que pertencem à categoria E têm featured_in_dropdown=true
    const featuredProducts = allProducts.filter(product => {
      console.log(`🔍 Processando produto: ${product.product_name}`)
      console.log(`   - category.id: ${product.category?.id} (tipo: ${typeof product.category?.id})`)
      console.log(`   - category.slug: ${product.category?.slug}`)
      console.log(`   - featured_in_dropdown: ${product.featured_in_dropdown}`)
      
      // Se categoryId for string (slug), filtrar por category.slug
      if (typeof categoryId === 'string') {
        const match = product.category?.slug === categoryId
        console.log(`   - Comparação slug: ${product.category?.slug} === ${categoryId} = ${match}`)
        return match && product.featured_in_dropdown === true
      }
      
      // Se categoryId for number (id), filtrar por category.id
      const categoryIdStr = String(categoryId)
      const match = product.category?.id === categoryIdStr
      console.log(`   - Comparação id: ${product.category?.id} === ${categoryIdStr} = ${match}`)
      return match && product.featured_in_dropdown === true
    })
    
    console.log('⭐ useFeaturedProductByCategory: Produtos featured encontrados para categoria', categoryId, ':', featuredProducts.length)
    if (featuredProducts.length > 0) {
      console.log('✅ Produto em destaque selecionado para categoria', categoryId, ':', featuredProducts[0].product_name)
    } else {
      console.log('⚠️ Nenhum produto featured encontrado para categoria', categoryId)
    }
    
    // Retornar o primeiro produto featured ou null se não houver
    return featuredProducts.length > 0 ? featuredProducts[0] : null
  }, [allProducts, categoryId])
  
  return useMemo(() => ({
    data: featuredProduct,
    isLoading,
    error
  }), [featuredProduct, isLoading, error])
}

// Função para gerar slug a partir do nome do produto
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-'); // Remove hífens duplicados
};



export const useProductBySlug = (slug: string) => {
  const [product, setProduct] = useState<ProductWithCategory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!slug) {
      setProduct(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Primeiro, tentar buscar por slug
      let { data, error } = await supabase
        .from(table('products'))
        .select(`
          *,
          category:categories!fk_products_category (
            id,
            name,
            slug
          ),
          subcategory:subcategories!fk_products_subcategory (
            id,
            name,
            slug
          ),
          product_images (
            id,
            image,
            alt_text,
            sort_order,
            is_primary
          )
        `)
        .eq('slug', slug)
        .eq('active', true)
        .single()

      // Se não encontrou por slug, tentar buscar por nome convertido para slug
      if (error && error.code === 'PGRST116') {
        const { data: productsByName, error: nameError } = await supabase
          .from(table('products'))
          .select(`
            *,
            category:categories!products_category_id_fkey (
              id,
              name,
              slug
            ),
            subcategory:categories!products_subcategory_id_fkey (
              id,
              name,
              slug
            ),
            product_images (
              id,
              image,
              alt_text,
              sort_order,
              is_primary
            )
          `)
          .eq('active', true)

        if (nameError) throw nameError

        // Encontrar produto cujo nome convertido para slug corresponde ao slug buscado
        const foundProduct = productsByName?.find((p: any) => 
          generateSlug(p.name || '') === slug
        )

        if (foundProduct) {
          data = foundProduct
          error = null
        } else {
          throw new Error('Produto não encontrado')
        }
      } else if (error) {
        throw error
      }

      if (data) {
        // Processar imagens - usar product_images se disponível, senão usar image_url
        const processedProduct: ProductWithCategory = {
          ...data,
          product_images: data.product_images && data.product_images.length > 0 
            ? data.product_images 
            : data.image 
              ? [{
                  id: '0',
                  image_url: data.image,
                  alt_text: data.name || '',
                  sort_order: 1
                }]
              : []
        }
        
        setProduct(processedProduct)
      }
    } catch (err) {
      console.error('Erro ao buscar produto:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setProduct(null)
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  return useMemo(() => ({
    data: product,
    isLoading,
    error
  }), [product, isLoading, error])
}

// Hook específico para produtos em destaque no dropdown
export const useFeaturedDropdownProducts = () => {
  const { data: allProducts, isLoading, error } = useProducts()
  
  const featuredProducts = useMemo(() => {
    if (!allProducts) return []
    
    console.log('🎯 useFeaturedDropdownProducts: Filtrando produtos em destaque no dropdown')
    console.log('📦 useFeaturedDropdownProducts: Total de produtos disponíveis:', allProducts.length)
    
    // Filtrar apenas produtos ativos E com featured_in_dropdown=true
    const filtered = allProducts.filter(product => {
      const isFeatured = product.featured_in_dropdown === true
      const isActive = product.active === true
      const isNotDisabled = !product.is_disabled
      
      console.log('🏷️ Produto:', product.product_name, {
        featured_in_dropdown: product.featured_in_dropdown,
        active: product.active,
        is_disabled: product.is_disabled,
        incluir: isFeatured && isActive && isNotDisabled
      })
      
      return isFeatured && isActive && isNotDisabled
    })
    
    console.log('✅ useFeaturedDropdownProducts: Produtos filtrados:', filtered.length)
    console.log('📋 useFeaturedDropdownProducts: Produtos encontrados:', filtered.map(p => p.product_name))
    
    return filtered
  }, [allProducts])
  
  return useMemo(() => ({
    data: featuredProducts,
    isLoading,
    error
  }), [featuredProducts, isLoading, error])
}

// Hook para buscar todos os produtos featured de uma categoria específica
export const useFeaturedProductsByCategory = (categoryId: string | number) => {
  const { data: allProducts, isLoading, error } = useProductsByCategory(categoryId)
  
  const featuredProducts = useMemo(() => {
    if (!allProducts) return []
    
    console.log('🎯 useFeaturedProductsByCategory: Filtrando produtos featured da categoria', categoryId)
    console.log('📦 Total de produtos na categoria:', allProducts.length)
    
    // Filtrar apenas produtos com featured_in_dropdown=true e ativos
    const filtered = allProducts.filter(product => {
      const isFeatured = product.featured_in_dropdown === true
      const isActive = product.active === true
      const isNotDisabled = !product.is_disabled
      
      console.log('🏷️ Produto:', product.product_name, {
        featured_in_dropdown: product.featured_in_dropdown,
        active: product.active,
        is_disabled: product.is_disabled,
        incluir: isFeatured && isActive && isNotDisabled
      })
      
      return isFeatured && isActive && isNotDisabled
    })
    
    console.log('✅ Produtos featured encontrados:', filtered.length)
    console.log('📋 Produtos:', filtered.map(p => p.product_name))
    
    return filtered
  }, [allProducts, categoryId])
  
  return useMemo(() => ({
    data: featuredProducts,
    isLoading,
    error
  }), [featuredProducts, isLoading, error])
}

// Hook para buscar os produtos mais recentes (últimos inseridos)
export const useLatestProducts = (limit: number = 6) => {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLatestProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Buscar produtos ordenados por data de criação (mais recentes primeiro)
      const { data: productsData, error: productsError } = await supabase
        .from(table('products'))
        .select(`
          id,
          name,
          description,
          benefits,
          category_id,
          subcategory_id,
          featured,
          featured_in_dropdown,
          is_disabled,
          featured_on_homepage,
          clearance_sale,
          image,
          created_at,
          category:categories!fk_products_category(
            id,
            name,
            slug
          ),
          subcategory:subcategories!fk_products_subcategory(
            id,
            name,
            slug
          )
        `)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (productsError) {
        throw new Error(`Falha ao carregar produtos recentes: ${productsError.message}`)
      }

      // Transformar os dados para manter compatibilidade com a interface existente
      const transformedProducts: ProductWithCategory[] = (productsData || []).map((product: any) => ({
        id: product.id,
        product_name: product.name,
        description: product.description || undefined,
        benefits: product.benefits || undefined,
        category_id: product.category_id,
        subcategory_id: product.subcategory_id,
        slug: generateSlug(product.name),
        featured: product.featured || false,
        featured_in_dropdown: product.featured_in_dropdown || false,
        is_disabled: product.is_disabled || false,
        featured_on_homepage: product.featured_on_homepage || false,
        clearance_sale: product.clearance_sale || false,
        active: true,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: Array.isArray(product.category) ? undefined : product.category,
        subcategory: Array.isArray(product.subcategory) ? undefined : product.subcategory,
        product_images: product.image ? [{ 
            id: '1', 
            product_id: product.id, 
            image_url: product.image, 
            sort_order: 1, 
            created_at: new Date().toISOString() 
          }] : []
      }))

      setProducts(transformedProducts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchLatestProducts()
  }, [fetchLatestProducts])

  return useMemo(() => ({
    data: products,
    isLoading,
    error,
    refetch: fetchLatestProducts
  }), [products, isLoading, error, fetchLatestProducts])
}

// Hook para buscar produtos similares da mesma subcategoria (excluindo o produto atual)
export const useSimilarProducts = (currentProductId: string | number, subcategoryId: string | number | null | undefined, limit: number = 4) => {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSimilarProducts = useCallback(async () => {
    if (!subcategoryId) {
      setProducts([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Buscar produtos da mesma subcategoria, excluindo o produto atual
      const { data: productsData, error: productsError } = await supabase
        .from(table('products'))
        .select(`
          id,
          name,
          description,
          benefits,
          category_id,
          subcategory_id,
          featured,
          featured_in_dropdown,
          is_disabled,
          featured_on_homepage,
          clearance_sale,
          image,
          created_at,
          category:categories!products_category_id_fkey(
            id,
            name,
            slug
          ),
          subcategory:categories!products_subcategory_id_fkey(
            id,
            name,
            slug
          )
        `)
        .eq('active', true)
        .eq('subcategory_id', subcategoryId)
        .neq('id', currentProductId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (productsError) {
        throw new Error(`Falha ao carregar produtos similares: ${productsError.message}`)
      }

      // Transformar os dados para manter compatibilidade com a interface existente
      const transformedProducts: ProductWithCategory[] = (productsData || []).map((product: any) => ({
        id: product.id,
        product_name: product.name,
        description: product.description || undefined,
        benefits: product.benefits || undefined,
        category_id: product.category_id,
        subcategory_id: product.subcategory_id,
        slug: generateSlug(product.name),
        featured: product.featured || false,
        featured_in_dropdown: product.featured_in_dropdown || false,
        is_disabled: product.is_disabled || false,
        featured_on_homepage: product.featured_on_homepage || false,
        clearance_sale: product.clearance_sale || false,
        active: true,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: Array.isArray(product.category) ? undefined : product.category,
        subcategory: Array.isArray(product.subcategory) ? undefined : product.subcategory,
        product_images: product.image ? [{ 
            id: '1', 
            product_id: product.id, 
            image_url: product.image, 
            sort_order: 1, 
            created_at: new Date().toISOString() 
          }] : []
      }))

      setProducts(transformedProducts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [currentProductId, subcategoryId, limit])

  useEffect(() => {
    fetchSimilarProducts()
  }, [fetchSimilarProducts])

  return useMemo(() => ({
    data: products,
    isLoading,
    error,
    refetch: fetchSimilarProducts
  }), [products, isLoading, error, fetchSimilarProducts])
}

export default useProducts;