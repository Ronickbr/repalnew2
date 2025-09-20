import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { ProductWithCategory } from '../types/product'

// Cache global para evitar múltiplas requisições
let productsCache: ProductWithCategory[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export const useProducts = () => {
  console.log('🚀 useProducts: Hook inicializado!')
  const [products, setProducts] = useState<ProductWithCategory[]>(productsCache || [])
  const [isLoading, setIsLoading] = useState(!productsCache)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    // Verificar se o cache ainda é válido
    const now = Date.now()
    if (productsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('📦 useProducts: Usando dados do cache')
      setProducts(productsCache)
      setIsLoading(false)
      return
    }

    try {
      console.log('📡 useProducts: Iniciando requisição ao Supabase...');
      setIsLoading(true);
      setError(null);
      
      // Buscar produtos com join duplo na tabela categories para obter categoria e subcategoria
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          product_name,
          description,
          benefits,
          category_id,
          subcategory_id,
          featured,
          featured_in_dropdown,
          is_disabled,
          featured_on_homepage,
          clearance_sale,
          image_url,
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
        .eq('active', true);
      
      console.log('📊 useProducts: Resposta do Supabase:', { data: productsData, error: productsError });
      console.log('📈 useProducts: Número de produtos encontrados:', productsData?.length || 0);
      
      if (productsError) {
        console.error('❌ useProducts: Erro ao buscar produtos:', productsError);
        throw new Error(`Falha ao carregar produtos: ${productsError.message}`);
      }
      
      // Transformar os dados para manter compatibilidade com a interface existente
      const transformedProducts: ProductWithCategory[] = (productsData || []).map(product => ({
        id: product.id,
        product_name: product.product_name,
        description: product.description || undefined,
        category_id: product.category_id,
        subcategory_id: product.subcategory_id,
        slug: generateSlug(product.product_name),
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
        product_images: product.image_url ? [{ 
          id: '1', 
          product_id: product.id, 
          image_url: product.image_url, 
          sort_order: 1, 
          created_at: new Date().toISOString() 
        }] : []
      }));
      
      // Atualizar cache
      productsCache = transformedProducts
      cacheTimestamp = now
      
      console.log('🔄 useProducts: Produtos transformados:', transformedProducts.length);
      console.log('📋 useProducts: Primeiros 3 produtos:', transformedProducts.slice(0, 3));
      setProducts(transformedProducts);
    } catch (err) {
      console.error('💥 useProducts: Erro inesperado:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      // Erro já tratado pelo estado de error
    } finally {
      setIsLoading(false);
      console.log('✅ useProducts: Busca finalizada');
    }
  }, []);

  useEffect(() => {
    console.log('🔄 useProducts: Iniciando busca de produtos...');
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
    if (!allProducts || !categoryId) return null
    
    console.log('⭐ useFeaturedProductByCategory: Buscando produto featured para categoria:', categoryId)
    
    // Filtrar produtos featured_in_dropdown para a categoria específica
    const featuredProducts = allProducts.filter(product => {
      if (!product.featured_in_dropdown) return false
      
      // Se categoryId for string (slug), filtrar por category.slug
      if (typeof categoryId === 'string') {
        return product.category?.slug === categoryId
      }
      
      // Se categoryId for number (id), filtrar por category.id
       return product.category?.id === String(categoryId)
    })
    
    console.log('⭐ useFeaturedProductByCategory: Produtos featured encontrados:', featuredProducts.length)
    
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
        .from('products')
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
            image_url,
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
          .from('products')
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
              image_url,
              alt_text,
              sort_order,
              is_primary
            )
          `)
          .eq('active', true)

        if (nameError) throw nameError

        // Encontrar produto cujo nome convertido para slug corresponde ao slug buscado
        const foundProduct = productsByName?.find(p => 
          generateSlug(p.product_name || '') === slug
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
            : data.image_url 
              ? [{
                  id: '0',
                  image_url: data.image_url,
                  alt_text: data.product_name || '',
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

export default useProducts;