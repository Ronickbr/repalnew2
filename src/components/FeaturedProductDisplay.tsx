import React from 'react';
import { useFeaturedProductByCategory, useProductsByCategory } from '../hooks/useProducts';
import { Search } from 'lucide-react';

interface FeaturedProductDisplayProps {
  categoryId: string | number;
  isOpen: boolean;
}

const FeaturedProductDisplay: React.FC<FeaturedProductDisplayProps> = ({ categoryId, isOpen }) => {
  const { data: featuredProduct, isLoading: isLoadingFeatured } = useFeaturedProductByCategory(categoryId);
  const { data: allProducts, isLoading: isLoadingAll } = useProductsByCategory(categoryId);

  console.log('🎯 FeaturedProductDisplay: Componente montado!');
  console.log('🎯 FeaturedProductDisplay: categoryId recebido:', categoryId, 'isOpen:', isOpen);
  console.log('🎯 FeaturedProductDisplay: featuredProduct:', featuredProduct);
  console.log('🎯 FeaturedProductDisplay: allProducts na categoria:', allProducts?.length);
  console.log('🎯 FeaturedProductDisplay: isLoadingFeatured:', isLoadingFeatured);
  console.log('🎯 FeaturedProductDisplay: isLoadingAll:', isLoadingAll);
   
  // Verificar se o Supabase está configurado
  const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  console.log('🔗 Supabase configurado:', isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    console.log('⚠️ Supabase não está configurado! Usando dados de demonstração.');
  }
  
  // Verificar se há erro de API (key inválida ou domínio não resolvido)
  const hasApiError = featuredProduct === undefined && allProducts === undefined && !isLoadingFeatured && !isLoadingAll;
  if (hasApiError) {
    console.log('🔴 Erro de API detectado - projeto Supabase pode estar deletado ou desativado');
    console.log('🔴 Domínio não resolvido: rmowtftvjodmpdmkzypb.supabase.co');
    console.log('ℹ️  Sistema operando em modo de demonstração com produto exemplo');
    console.log('💡 Para restaurar o banco de dados: crie um novo projeto em https://supabase.com');
  }
   
  // Se não houver produto em destaque, usar o primeiro produto da categoria
  const displayProduct = featuredProduct || (allProducts && allProducts.length > 0 ? allProducts[0] : null);
  const isLoading = isLoadingFeatured || isLoadingAll;
  const isFallback = !featuredProduct && !!displayProduct; // É um fallback se não houver produto em destaque mas houver produtos na categoria
  
  console.log('🎯 FeaturedProductDisplay: displayProduct final:', displayProduct);
  console.log('🎯 FeaturedProductDisplay: isFallback:', isFallback);
   
  // Forçar modo de demonstração quando não há Supabase configurado ou erro de API
  const shouldUseDemo = !isSupabaseConfigured || hasApiError || (!featuredProduct && (!allProducts || allProducts.length === 0));
  console.log('🎭 Usar modo demonstração:', shouldUseDemo);
  if (shouldUseDemo) {
    console.log('🎯 Motivo do modo demonstração:', 
      !isSupabaseConfigured ? 'Supabase não configurado' :
      hasApiError ? 'Erro de API (possível chave inválida)' :
      'Sem produtos disponíveis'
    );
  }
  
  // Produto de exemplo para debug quando não há produtos ou Supabase não configurado
  const mockProduct = {
    id: 1,
    product_name: 'Liquidificador Maxi Blender',
    image_url: '/images/bm2-liquidificador-maxi-blender-copo-tritan-alta-rotacao-com-variador-de-velocidade-2-0-litros-2-238-w-220-240-v_4549.jpg',
    slug: 'liquidificador-maxi-blender'
  };

  // Teste: verificar se categoryId é válido
  if (!categoryId) {
    console.log('⚠️ FeaturedProductDisplay: categoryId é inválido:', categoryId);
    return null;
  }

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="animate-pulse p-4">
        <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!displayProduct || shouldUseDemo) {
    // Para debug, vamos mostrar o produto de exemplo
    console.log('🎯 Mostrando produto de exemplo para debug');
    return (
      <div className="text-center p-4">
        <div className="relative overflow-hidden rounded-lg mb-4 group">
          <img
            src={mockProduct.image_url}
            alt={mockProduct.product_name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2" style={{ fontSize: '18px' }}>
            {mockProduct.product_name}
          </h4>
          <p className="text-xs text-orange-500 mt-1">
            {!isSupabaseConfigured ? 'Supabase não configurado' : 'Modo de demonstração - Adicione produtos à categoria'}
          </p>
        </div>
        
        <button
          className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-all duration-200"
          onClick={() => {
            window.location.href = `/produto/${mockProduct.slug}`;
          }}
        >
          <Search className="w-4 h-4" />
          <span>Ver Detalhes</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Imagem do produto em alta resolução */}
      <div className="relative overflow-hidden rounded-lg mb-4 group">
        <img
          src={displayProduct.image_url || '/placeholder-product.png'}
          alt={displayProduct.product_name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-product.png';
            target.alt = 'Imagem indisponível';
          }}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      {/* Nome/título do item em destaque */}
      <div className="mb-4">
        <h4 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2" style={{ fontSize: '18px' }}>
          {displayProduct.product_name}
        </h4>
        {isFallback && (
          <p className="text-xs text-gray-500 mt-1">Este produto foi selecionado automaticamente</p>
        )}
      </div>
      
      {/* Botão Ver Detalhes */}
      <button
        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#2E86AB] text-white font-medium rounded-lg hover:bg-[#267399] active:bg-[#1f5e7f] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:ring-opacity-50"
        onClick={() => {
          // Navegar para página de detalhes do produto
          window.location.href = `/produto/${displayProduct.id}`;
        }}
        aria-label={`Ver detalhes de ${displayProduct.product_name}`}
      >
        <Search className="w-4 h-4" />
        <span>Ver Detalhes</span>
      </button>
    </div>
  );
};

export { FeaturedProductDisplay };