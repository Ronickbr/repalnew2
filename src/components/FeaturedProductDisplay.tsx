import React from 'react';
import { useFeaturedProductByCategory, useProductsByCategory } from '../hooks/useProducts';

import { Search } from 'lucide-react';

interface FeaturedProductDisplayProps {
  categoryId: string | number;
  isOpen: boolean;
}

const FeaturedProductDisplay: React.FC<FeaturedProductDisplayProps> = ({ categoryId, isOpen }) => {
  const { data: featuredProduct, isLoading: isLoadingFeatured, error: featuredError } = useFeaturedProductByCategory(categoryId);
  const { data: allProducts, isLoading: isLoadingAll, error: allProductsError } = useProductsByCategory(categoryId);

  // Mostrar apenas produtos featured - não usar fallback para produtos normais
  const displayProduct = featuredProduct;

  console.log('🎯 FeaturedProductDisplay: Supabase configurado?', Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY));
  console.log('🎯 FeaturedProductDisplay: Produto selecionado:', displayProduct?.product_name, 'Categoria:', categoryId);
  console.log('🎯 FeaturedProductDisplay: Produto featured encontrado:', featuredProduct?.product_name);
  console.log('🎯 FeaturedProductDisplay: Fallback ativado?', !featuredProduct && allProducts && allProducts.length > 0);

  console.log('🎯 FeaturedProductDisplay: Componente montado!');
  console.log('🎯 FeaturedProductDisplay: categoryId recebido:', categoryId, 'isOpen:', isOpen);
  console.log('🎯 FeaturedProductDisplay: featuredProduct:', featuredProduct);
  console.log('🎯 FeaturedProductDisplay: featuredError:', featuredError);
  console.log('🎯 FeaturedProductDisplay: allProducts na categoria:', allProducts?.length);
  console.log('🎯 FeaturedProductDisplay: allProductsError:', allProductsError);
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
   
  const isLoading = isLoadingFeatured || isLoadingAll;
  const hasFeaturedProduct = !!featuredProduct;
  
  console.log('🎯 FeaturedProductDisplay: hasFeaturedProduct:', hasFeaturedProduct);
   
  // Forçar modo de demonstração apenas quando não há Supabase configurado ou erro de API
  // TEMPORÁRIO: Desativar modo demo forçado para testar produtos do banco
  const shouldUseDemo = false; // !isSupabaseConfigured || hasApiError;
  console.log('🎭 Usar modo demonstração:', shouldUseDemo);
  
  // Produtos de exemplo para debug quando não há produtos ou Supabase não configurado
  const mockProductsByCategory = {
    '1': { // Eletroportáteis
      id: 1,
      product_name: 'Liquidificador Maxi Blender 2.0L',
      image_url: '/images/bm2-liquidificador-maxi-blender-copo-tritan-alta-rotacao-com-variador-de-velocidade-2-0-litros-2-238-w-220-240-v_4549.jpg',
      slug: 'liquidificador-maxi-blender-2l'
    },
    '2': { // Panelas
      id: 2,
      product_name: 'Panela de Pressão Elétrica 6L',
      image_url: '/images/panela-pressao-eletrica-6l.jpg',
      slug: 'panela-pressao-eletrica-6l'
    },
    '3': { // Utensílios
      id: 3,
      product_name: 'Conjunto de Facas Profissionais 5 peças',
      image_url: '/images/conjunto-facas-profissionais.jpg',
      slug: 'conjunto-facas-profissionais'
    }
  };

  // Selecionar produto de exemplo baseado na categoria
  const mockProduct = mockProductsByCategory[categoryId as keyof typeof mockProductsByCategory] || mockProductsByCategory['1'];

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

  if (!displayProduct && !shouldUseDemo) {
    // Nenhum produto featured encontrado para esta categoria
    return (
      <div className="text-center p-4 text-gray-500">
        <div className="flex flex-col items-center justify-center h-full">
          <Search className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm font-medium">Nenhum produto em destaque</p>
          <p className="text-xs mt-1">Marque um produto como "Destaque no Menu Dropdown" para exibir aqui</p>
        </div>
      </div>
    );
  }

  // Se houver produto em destaque do banco, exibir ele
  if (hasFeaturedProduct && !shouldUseDemo && displayProduct) {
    return (
      <div className="p-4">
        <div className="text-center">
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
      </div>
    );
  }

  if (shouldUseDemo) {
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
            {!isSupabaseConfigured ? 'Supabase não configurado' : 'Modo de demonstração - Marque um produto como "Destaque no Menu Dropdown"'}
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
      <div className="text-center">
        {/* Imagem do produto em alta resolução */}
        <div className="relative overflow-hidden rounded-lg mb-4 group">
          <img
            src={displayProduct?.image_url || '/placeholder-product.png'}
            alt={displayProduct?.product_name || 'Produto'}
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
            {displayProduct?.product_name || 'Produto'}
          </h4>
        </div>
        
        {/* Botão Ver Detalhes */}
        <button
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#2E86AB] text-white font-medium rounded-lg hover:bg-[#267399] active:bg-[#1f5e7f] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:ring-opacity-50"
          onClick={() => {
            // Navegar para página de detalhes do produto
            window.location.href = `/produto/${displayProduct?.id}`;
          }}
          aria-label={`Ver detalhes de ${displayProduct?.product_name || 'produto'}`}
        >
          <Search className="w-4 h-4" />
          <span>Ver Detalhes</span>
        </button>
      </div>
    </div>
  );
};

export { FeaturedProductDisplay };