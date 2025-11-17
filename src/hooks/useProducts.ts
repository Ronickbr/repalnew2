import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { table } from '../lib/schema'
import type { ProductWithCategory } from '../types/product'

// Interface para subcategoria com ID numérico
export interface SubcategoryWithId {
  id: number;
  name: string;
  slug: string;
  category_id: number;
}

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
          .eq('active', true);
        
        if (productsError) {
          throw new Error(`Falha ao carregar produtos: ${productsError.message}`);
        }
        
        // Buscar categorias separadamente para mapeamento
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name, slug')
          .eq('active', true);

        // Criar mapa de categorias para lookup rápido
        const categoryMap = new Map();
        categoriesData?.forEach((cat: any) => {
          categoryMap.set(cat.id, cat);
        });

        // Transformar os dados para manter compatibilidade com a interface existente
      const transformedProducts: ProductWithCategory[] = (productsData || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description || undefined,
        category_id: product.category_id,
        subcategory_id: product.subcategory_id,
        slug: product.slug || generateSlug(product.name),
        featured: product.featured || false,
        featured_in_dropdown: product.featured_in_dropdown || false,
        is_disabled: product.is_disabled || false,
        featured_on_homepage: product.featured_on_homepage || false,
        active: product.active !== undefined ? product.active : true,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
        category: categoryMap.get(product.category_id),
        debug_category_id: product.category_id,
        debug_category_found: !!categoryMap.get(product.category_id),
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
        
        setProducts(transformedProducts)
      console.log('✅ useLatestProducts: Produtos transformados:', transformedProducts.length);
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

// Hook para buscar produtos por subcategoria com fallback para categoria principal
export const useProductsBySubcategory = (subcategoryId: string | number, categoryId?: string | number) => {
  const { data: allProducts, isLoading, error } = useProducts()
  
  const filteredProducts = useMemo(() => {
    if (!allProducts || !subcategoryId) return []
    
    console.log('🔍 useProductsBySubcategory: Filtrando produtos para subcategoria:', subcategoryId)
    console.log('📦 useProductsBySubcategory: Total de produtos disponíveis:', allProducts.length)
    
    // Se subcategoryId for string (slug), filtrar por subcategory_id com lookup na tabela subcategories
    if (typeof subcategoryId === 'string') {
      console.log('🔍 DEBUG: Todos os produtos com subcategory_id:')
      allProducts.forEach(product => {
        console.log(`  - ${product.name}: subcategory_id = ${product.subcategory_id}`)
      })
      
      const filtered = allProducts.filter(product => {
        const productSubcategoryId = product.subcategory_id
        console.log('🏷️ Produto:', product.name, 'Subcategory ID:', productSubcategoryId, 'Buscando:', subcategoryId)
        return String(productSubcategoryId) === subcategoryId
      })
      
      console.log('✅ useProductsBySubcategory: Produtos filtrados por subcategoria:', filtered.length)
      
      // Se não encontrou produtos na subcategoria e temos categoryId, mostrar produtos da categoria principal
      if (filtered.length === 0 && categoryId) {
        console.log('⚠️ Nenhum produto encontrado na subcategoria. Buscando produtos da categoria principal:', categoryId)
        
        const fallbackProducts = allProducts.filter(product => {
          if (typeof categoryId === 'string') {
            return product.category?.slug === categoryId
          } else {
            return String(product.category?.id) === String(categoryId)
          }
        })
        
        console.log('✅ Fallback: Produtos da categoria principal encontrados:', fallbackProducts.length)
        return fallbackProducts
      }
      
      return filtered
    }
    
    // Se subcategoryId for number (id), filtrar por subcategory_id
    const filtered = allProducts.filter(product => {
      const productSubcategoryId = product.subcategory_id
      console.log('🏷️ Produto:', product.name, 'Subcategory ID:', productSubcategoryId, 'Buscando:', subcategoryId)
      return String(productSubcategoryId) === String(subcategoryId)
    })
    
    console.log('✅ useProductsBySubcategory: Produtos filtrados por ID de subcategoria:', filtered.length)
    
    // Se não encontrou produtos na subcategoria e temos categoryId, mostrar produtos da categoria principal
    if (filtered.length === 0 && categoryId) {
      console.log('⚠️ Nenhum produto encontrado na subcategoria. Buscando produtos da categoria principal:', categoryId)
      
      const fallbackProducts = allProducts.filter(product => {
        if (typeof categoryId === 'string') {
          return product.category?.slug === categoryId
        } else {
          return String(product.category?.id) === String(categoryId)
        }
      })
      
      console.log('✅ Fallback: Produtos da categoria principal encontrados:', fallbackProducts.length)
      return fallbackProducts
    }
    
    return filtered
  }, [allProducts, subcategoryId, categoryId])
  
  return useMemo(() => ({
    data: filteredProducts,
    isLoading,
    error
  }), [filteredProducts, isLoading, error])
}

export const useProductsByCategory = (categoryId: string | number) => {
  const { data: allProducts, isLoading, error } = useProducts()
  
  const filteredProducts = useMemo(() => {
    if (!allProducts || !categoryId) return []
    
    console.log('🔍 useProductsByCategory: Filtrando produtos para categoria:', categoryId)
    console.log('📦 useProductsByCategory: Total de produtos disponíveis:', allProducts.length)
    
    // Se categoryId for string (slug), filtrar por category.slug
    if (typeof categoryId === 'string') {
      console.log('🔍 DEBUG: Todos os produtos disponíveis:')
      allProducts.forEach(product => {
        console.log(`  - ${product.name}: category.slug = ${product.category?.slug}`)
      })
      
      const filtered = allProducts.filter(product => {
        const productCategorySlug = product.category?.slug
        console.log('🏷️ Produto:', product.name, 'Category Slug:', productCategorySlug, 'Buscando:', categoryId)
        return productCategorySlug === categoryId
      })
      console.log('✅ useProductsByCategory: Produtos filtrados por slug:', filtered.length)
      return filtered
    }
    
    // Se categoryId for number (id), filtrar por category.id
    const filtered = allProducts.filter(product => {
      const productCategoryId = product.category?.id
      console.log('🏷️ Produto:', product.name, 'Category ID:', productCategoryId, 'Buscando:', categoryId)
      return String(productCategoryId) === String(categoryId)
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
      console.log(`  - ${p.name}: categoria=${p.category?.name} (${p.category?.id}), slug=${p.category?.slug}`)
    })
    
    // Filtrar produtos que pertencem à categoria E têm featured_in_dropdown=true
    const featuredProducts = allProducts.filter(product => {
      console.log(`🔍 Processando produto: ${product.name}`)
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
      const match = String(product.category?.id) === categoryIdStr
      console.log(`   - Comparação id: ${product.category?.id} === ${categoryIdStr} = ${match}`)
      return match && product.featured_in_dropdown === true
    })
    
    console.log('⭐ useFeaturedProductByCategory: Produtos featured encontrados para categoria', categoryId, ':', featuredProducts.length)
    if (featuredProducts.length > 0) {
      console.log('✅ Produto em destaque selecionado para categoria', categoryId, ':', featuredProducts[0].name)
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
          product_images (
            id,
            image_url,
            display_order
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
            product_images (
              id,
              image_url,
              display_order
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
        // Buscar categoria do produto
        let productCategory = null;
        if (data.category_id) {
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id, name, slug')
            .eq('id', data.category_id)
            .single();
          productCategory = categoryData;
        }

        // Processar imagens - usar product_images se disponível, senão usar image_url
        const processedProduct: ProductWithCategory = {
          ...data,
          name: data.name || 'Produto',
          category: productCategory,
          specifications: data.specifications || undefined,
          product_images: data.product_images && data.product_images.length > 0 
            ? data.product_images.map((img: any) => ({
                id: img.id,
                image_url: img.image_url,
                sort_order: img.display_order ?? img.sort_order ?? 0,
                created_at: new Date().toISOString()
              }))
            : data.image 
              ? [{
                  id: '0',
                  image_url: data.image,
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
      const isActive = !product.is_disabled
      
      console.log('🏷️ Produto:', product.name, {
        featured_in_dropdown: product.featured_in_dropdown,
        is_disabled: product.is_disabled,
        incluir: isFeatured && isActive
      })
      
      return isFeatured && isActive
    })
    
    console.log('✅ useFeaturedDropdownProducts: Produtos filtrados:', filtered.length)
    console.log('📋 useFeaturedDropdownProducts: Produtos encontrados:', filtered.map(p => p.name))
    
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
      const isActive = !product.is_disabled
      
      console.log('🏷️ Produto:', product.name, {
        featured_in_dropdown: product.featured_in_dropdown,
        is_disabled: product.is_disabled,
        incluir: isFeatured && isActive
      })
      
      return isFeatured && isActive
    })
    
    console.log('✅ Produtos featured encontrados:', filtered.length)
    console.log('📋 Produtos:', filtered.map(p => p.name))
    
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
      console.log('🔄 useLatestProducts: Iniciando busca de produtos recentes...')
      setIsLoading(true)
      setError(null)

      // Buscar produtos ordenados por data de criação (mais recentes primeiro)
      const { data: productsData, error: productsError } = await supabase
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
        .limit(limit)

      if (productsError) {
        console.log('❌ useLatestProducts: Erro ao buscar produtos:', productsError.message)
        throw new Error(`Falha ao carregar produtos recentes: ${productsError.message}`)
      }

      console.log('✅ useLatestProducts: Produtos brutos encontrados:', productsData?.length || 0)
      
      // Debug dos dados brutos do primeiro produto
      if (productsData && productsData.length > 0) {
        console.log('📋 DADOS BRUTOS DO PRIMEIRO PRODUTO:', {
          id: productsData[0].id,
          name: productsData[0].name,
          category_id: productsData[0].category_id,
          active: productsData[0].active,
          is_disabled: productsData[0].is_disabled,
          slug: productsData[0].slug
        });
      }

      // Buscar categorias para mapeamento
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('active', true);

      if (categoriesError) {
        console.log('❌ useLatestProducts: Erro ao buscar categorias:', categoriesError.message);
      } else {
        console.log('✅ useLatestProducts: Categorias encontradas:', categoriesData?.length || 0);
      }

      const categoryMap = new Map();
      categoriesData?.forEach((cat: any) => {
        categoryMap.set(cat.id, cat);
      });

      // Transformar os dados para manter compatibilidade com a interface existente
      const transformedProducts: ProductWithCategory[] = (productsData || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description || undefined,
        benefits: undefined,
        category_id: product.category_id,
        slug: product.slug || generateSlug(product.name),
        featured: product.featured || false,
        featured_in_dropdown: product.featured_in_dropdown || false,
        is_disabled: product.is_disabled || false,
        featured_on_homepage: product.featured_on_homepage || false,
        clearance_sale: product.clearance_sale || false,
        active: product.active !== undefined ? product.active : true,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
        category: categoryMap.get(product.category_id),
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
export const useSimilarProducts = (currentProductId: string | number, categoryId: string | number | null | undefined, limit: number = 4) => {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSimilarProducts = useCallback(async () => {
    if (!categoryId) {
      setProducts([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Buscar produtos da mesma categoria, excluindo o produto atual
      const { data: productsData, error: productsError } = await supabase
        .from(table('products'))
        .select(`
          id,
          name,
          slug,
          description,
          description,
          category_id,
          featured,
          featured_in_dropdown,
          is_disabled,
          featured_on_homepage,
          clearance_sale,
          image,
          created_at,
          updated_at
        `)
        .eq('active', true)
        .eq('category_id', categoryId)
        .neq('id', currentProductId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (productsError) {
        throw new Error(`Falha ao carregar produtos similares: ${productsError.message}`)
      }

      // Buscar categorias para mapeamento
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('active', true);

      const categoryMap = new Map();
      categoriesData?.forEach((cat: any) => {
        categoryMap.set(cat.id, cat);
      });

      // Transformar os dados para manter compatibilidade com a interface existente
      const transformedProducts: ProductWithCategory[] = (productsData || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description || undefined,
        benefits: undefined,
        category_id: product.category_id,
        slug: product.slug || generateSlug(product.name),
        featured: product.featured || false,
        featured_in_dropdown: product.featured_in_dropdown || false,
        is_disabled: product.is_disabled || false,
        featured_on_homepage: product.featured_on_homepage || false,
        clearance_sale: product.clearance_sale || false,
        active: product.active !== undefined ? product.active : true,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
        category: categoryMap.get(product.category_id),
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
  }, [currentProductId, categoryId, limit])

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

// Hook para buscar subcategorias usando a nova estrutura com parent_id
export const useSubcategories = (categoryId?: string | number) => {
  const [subcategories, setSubcategories] = useState<SubcategoryWithId[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubcategories = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .not('parent_id', 'is', null)
        .eq('active', true)

      if (categoryId) {
        query = query.eq('parent_id', categoryId)
      }

      const { data, error: subError } = await query.order('name')

      if (subError) {
        throw new Error(`Falha ao carregar subcategorias: ${subError.message}`)
      }

      // Transformar dados para manter compatibilidade com interface antiga
      const transformedSubcategories = (data || []).map((subcat: any) => ({
        id: subcat.id,
        name: subcat.name,
        slug: subcat.slug,
        category_id: subcat.parent_id
      }))

      setSubcategories(transformedSubcategories)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setSubcategories([])
    } finally {
      setIsLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    fetchSubcategories()
  }, [fetchSubcategories])

  return useMemo(() => ({
    data: subcategories,
    isLoading,
    error,
    refetch: fetchSubcategories
  }), [subcategories, isLoading, error, fetchSubcategories])
}

export default useProducts;
