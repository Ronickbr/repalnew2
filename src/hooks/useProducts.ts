import { useState, useEffect, useMemo } from 'react';
import { supabase, Product } from '../lib/supabase';

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProducts = (): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
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
        `);
      
      if (productsError) {
        throw new Error(`Falha ao carregar produtos: ${productsError.message}`);
      }
      
      // Transformar os dados para manter compatibilidade com a interface existente
      const transformedProducts: Product[] = (productsData || []).map(product => ({
        id: product.id,
        product_name: product.product_name,
        description: product.description || undefined,
        category_id: product.category_id,
        subcategory_id: product.subcategory_id,
        slug: generateSlug(product.product_name),
        featured: product.featured || false,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: Array.isArray(product.category) ? undefined : product.category,
        subcategory: Array.isArray(product.subcategory) ? undefined : product.subcategory,
        product_images: product.image_url ? [{ 
          id: 1, 
          product_id: product.id, 
          image_url: product.image_url, 
          sort_order: 1, 
          created_at: new Date().toISOString() 
        }] : []
      }));
      
      setProducts(transformedProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      // Erro já tratado pelo estado de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const refetch = async () => {
    await fetchProducts();
  };

  return {
    products,
    loading,
    error,
    refetch
  };
};

export const useProductsByCategory = (categoryId: number | string) => {
  const { products, loading, error, refetch } = useProducts();
  
  const filteredProducts = useMemo(() => {
    if (!categoryId) return products;
    return products.filter(product => product.category_id === categoryId || product.category_id === Number(categoryId));
  }, [products, categoryId]);
  
  return {
    data: filteredProducts,
    isLoading: loading,
    error,
    refetch
  };
};

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
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Buscar produto por slug ou nome convertido para slug
        let productData = null;
        let productError = null;
        
        // Primeiro, tentar buscar por slug
        const { data: slugData } = await supabase
          .from('products')
          .select(`
            id,
            product_name,
            description,
            benefits,
            specifications,
            category_id,
            subcategory_id,
            featured,
            image_url,
            slug,
            category:categories!products_category_id_fkey(
              id,
              name,
              slug,
              parent_id
            ),
            subcategory:categories!products_subcategory_id_fkey(
              id,
              name,
              slug
            ),
            product_images(
              id,
              image_url,
              alt_text,
              sort_order,
              is_primary
            )
          `)
          .eq('slug', slug)
          .maybeSingle();
        
        if (slugData) {
          productData = slugData;
        } else {
          // Se não encontrou por slug, buscar por nome convertido para slug
          const { data: allProducts, error: allProductsError } = await supabase
            .from('products')
            .select(`
              id,
              product_name,
              description,
              benefits,
              specifications,
              category_id,
              subcategory_id,
              featured,
              image_url,
              slug,
              category:categories!products_category_id_fkey(
                id,
                name,
                slug,
                parent_id
              ),
              subcategory:categories!products_subcategory_id_fkey(
                id,
                name,
                slug
              ),
              product_images(
                id,
                image_url,
                alt_text,
                sort_order,
                is_primary
              )
            `);
          
          if (allProductsError) {
            throw new Error(`Erro ao buscar produtos: ${allProductsError.message}`);
          }
          
          // Encontrar produto cujo nome gera o slug procurado
          productData = allProducts?.find(p => generateSlug(p.product_name) === slug) || null;
          productError = allProductsError;
        }
        
        if (productError && typeof productError === 'object' && 'code' in productError && (productError as any).code !== 'PGRST116') {
          throw new Error(`Produto não encontrado: ${(productError as any).message}`);
        }
        
        if (!productData) {
          throw new Error('Produto não encontrado');
        }
        

        
        // Processar imagens da nova tabela product_images
        const productImages = (productData.product_images || []).map((img: any) => ({
          id: img.id,
          product_id: img.product_id,
          image_url: img.image_url,
          alt_text: img.alt_text || productData.product_name,
          sort_order: img.sort_order || 0,
          is_primary: img.is_primary || false,
          created_at: img.created_at || new Date().toISOString()
        })).sort((a: any, b: any) => a.sort_order - b.sort_order);

        // Se não há imagens na nova tabela, usar a image_url da tabela products como fallback
        const finalImages = productImages.length > 0 ? productImages : 
          (productData.image_url ? [{ 
            id: 0, 
            product_id: productData.id, 
            image_url: productData.image_url,
            alt_text: productData.product_name,
            sort_order: 0,
            is_primary: true,
            created_at: new Date().toISOString() 
          }] : []);

        const transformedProduct: Product = {
          id: productData.id,

          product_name: productData.product_name,
          description: productData.description || undefined,
          benefits: productData.benefits || undefined,
          specifications: productData.specifications || undefined,
          category_id: productData.category_id,
          subcategory_id: productData.subcategory_id,
          image_url: productData.image_url,
          featured: productData.featured || false,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category: productData.category && !Array.isArray(productData.category) && typeof productData.category === 'object' ? {
            id: (productData.category as any).id,
            name: (productData.category as any).name,
            slug: (productData.category as any).slug,
            description: (productData.category as any).description || '',
            sort_order: (productData.category as any).sort_order || 0,
            created_at: (productData.category as any).created_at || new Date().toISOString(),
            updated_at: (productData.category as any).updated_at || new Date().toISOString(),
            parent_id: (productData.category as any).parent_id
          } : undefined,
          slug: productData.slug || generateSlug(productData.product_name),
          images: finalImages
        };
        
        setProduct(transformedProduct);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        // Erro já tratado pelo estado de error
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  return {
    data: product,
    isLoading: loading,
    error
  };
};

export default useProducts;