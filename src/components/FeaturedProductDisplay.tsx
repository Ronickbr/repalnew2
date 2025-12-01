import React from 'react';
import { useFeaturedProductByCategory, useProductsByCategory } from '../hooks/useProducts';
import type { ProductWithCategory } from '../types/product';

import { Search } from 'lucide-react';

interface FeaturedProductDisplayProps {
  categoryId: string | number;
  isOpen: boolean;
}

const FeaturedProductDisplay: React.FC<FeaturedProductDisplayProps> = ({ categoryId, isOpen }) => {
  const { data: featuredProduct, isLoading: isLoadingFeatured } = useFeaturedProductByCategory(categoryId);
  const { data: allProducts, isLoading: isLoadingAll } = useProductsByCategory(categoryId);

  // Produtos de exemplo para debug quando não há produtos ou Supabase não configurado
  const mockProductsByCategory = {
    '1': { // Eletroportáteis
      id: 1,
      name: 'Liquidificador Maxi Blender 2.0L',
      image_url: '/images/bm2-liquidificador-maxi-blender-copo-tritan-alta-rotacao-com-variador-de-velocidade-2-0-litros-2-238-w-220-240-v_4549.jpg',
      slug: 'liquidificador-maxi-blender-2l'
    },
    '2': { // Panelas
      id: 2,
      name: 'Panela de Pressão Elétrica 6L',
      image_url: '/images/panela-pressao-eletrica-6l.jpg',
      slug: 'panela-pressao-eletrica-6l'
    },
    '3': { // Utensílios
      id: 3,
      name: 'Conjunto de Facas Profissionais 5 peças',
      image_url: '/images/conjunto-facas-profissionais.jpg',
      slug: 'conjunto-facas-profissionais'
    }
  };

  // Selecionar produto de exemplo baseado na categoria
  const mockProduct = mockProductsByCategory[categoryId as keyof typeof mockProductsByCategory] || mockProductsByCategory['1'] || mockProductsByCategory[1];

  // Verificar se o Supabase está configurado
  const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  // Verificar se há erro de API (key inválida ou domínio não resolvido)
  const hasApiError = featuredProduct === undefined && allProducts === undefined && !isLoadingFeatured && !isLoadingAll;
  
  const isLoading = isLoadingFeatured || isLoadingAll;
  const hasFeaturedProduct = !!featuredProduct;
  
  
    
  // Forçar modo de demonstração apenas quando não há Supabase configurado ou erro de API
  const shouldUseDemo = !isSupabaseConfigured || hasApiError;

  // Mostrar apenas produtos featured - não usar fallback para produtos normais
  let displayProduct: ProductWithCategory | undefined = featuredProduct || undefined;
  if (!displayProduct && shouldUseDemo) {
    displayProduct = {
      id: String(mockProduct.id),
      name: mockProduct.name,
      slug: mockProduct.slug,
      featured: false,
      image_url: mockProduct.image_url,
      active: true,
    } as ProductWithCategory;
  }
  if (!displayProduct && allProducts?.[0]) {
    displayProduct = allProducts[0];
  }

  

  // Teste: verificar se categoryId é válido
  if (!categoryId) {
    
    return null;
  }

  if (!isOpen) return null;

  if (isLoading) {
    // Retorno para estado de Loading
    return (
      <div className="animate-pulse p-4">
        <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-10 bg-gray-200 rounded mb-2"></div> {/* Placeholder para o primeiro botão */}
        <div className="h-10 bg-gray-200 rounded"></div> {/* Placeholder para o segundo botão */}
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
          <div className="relative w-full aspect-square max-w-[160px] mx-auto mb-4 overflow-hidden rounded-lg group">
            <img
              src={displayProduct.image_url || '/placeholder-product.png'}
              alt={displayProduct.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2" style={{ fontSize: '18px' }}>
              {displayProduct.name}
            </h4>
          </div>
          
          {/* Botão 1: Ver Mais (Vermelho/Laranja) */}
        <button
          className="w-full py-3 bg-gradient-to-r from-[#E75A1F] to-[#F06422] text-white font-semibold rounded-lg hover:from-[#d0501c] hover:to-[#e05a1f] active:from-[#b84618] active:to-[#c8501c] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 shadow-md hover:shadow-lg mb-2"
          onClick={() => {
            // Navegar para página de detalhes do produto
            window.location.href = `/produto/${displayProduct.id}`;
          }}
          aria-label={`Ver detalhes de ${displayProduct.name}`}
        >
          Ver Mais
        </button>

          {/* Botão 2: Add a Lista (Abaixo) */}
        <button
          className="w-full py-3 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 shadow-sm"
          onClick={() => {
            // Ação para adicionar o produto à lista
            
          }}
          aria-label={`Adicionar ${displayProduct.name} à lista`}
        >
          Add a Lista
        </button>
        </div>
      </div>
    );
  }

  if (shouldUseDemo) {
    // Para debug, vamos mostrar o produto de exemplo
    
    return (
      <div className="text-center p-4">
        <div className="relative w-full aspect-square max-w-[160px] mx-auto mb-4 overflow-hidden rounded-lg group">
          <img
            src={mockProduct.image_url}
            alt={mockProduct.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2" style={{ fontSize: '18px' }}>
            {mockProduct.name}
          </h4>
          <p className="text-xs text-orange-500 mt-1">
            {!isSupabaseConfigured ? 'Supabase não configurado' : 'Modo de demonstração - Marque um produto como "Destaque no Menu Dropdown"'}
          </p>
        </div>
        
          {/* Botão 1: Ver Mais (Vermelho/Laranja) */}
        <button
          className="w-full py-3 bg-gradient-to-r from-[#E75A1F] to-[#F06422] text-white font-semibold rounded-lg hover:from-[#d0501c] hover:to-[#e05a1f] active:from-[#b84618] active:to-[#c8501c] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 shadow-md hover:shadow-lg mb-2"
          onClick={() => {
            window.location.href = `/produto/${mockProduct.slug}`;
          }}
        >
          Ver Mais
        </button>
        
          {/* Botão 2: Add a Lista (Abaixo) */}
        <button
          className="w-full py-3 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 shadow-sm"
          onClick={() => {
            
          }}
        >
          Add a Lista
        </button>
      </div>
    );
  }

  // Retorno final (Fallback)
  return (
    <div className="p-4">
      <div className="text-center">
        {/* Imagem do produto em alta resolução */}
        <div className="relative w-full aspect-square max-w-[160px] mx-auto mb-4 overflow-hidden rounded-lg group">
          <img
            src={displayProduct?.image_url || '/placeholder-product.png'}
            alt={displayProduct?.name || 'Produto'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
        <div className="mb-6">
          <h4 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2" style={{ fontSize: '18px' }}>
            {displayProduct?.name || 'Produto'}
          </h4>
        </div>
        
        {/* Botão 1: Ver Mais (Vermelho/Laranja) */}
        <button
          className="w-full py-3 bg-gradient-to-r from-[#E75A1F] to-[#F06422] text-white font-semibold rounded-lg hover:from-[#d0501c] hover:to-[#e05a1f] active:from-[#b84618] active:to-[#c8501c] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 shadow-md hover:shadow-lg mb-2"
          onClick={() => {
            // Navegar para página de detalhes do produto
            window.location.href = `/produto/${displayProduct?.id}`;
          }}
          aria-label={`Ver detalhes de ${displayProduct?.name || 'produto'}`}
        >
          Ver Mais
        </button>

          {/* Botão 2: Add a Lista (Abaixo) */}
        <button
          className="w-full py-3 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 shadow-sm"
          onClick={() => {
            // Ação para adicionar o produto à lista
            
          }}
          aria-label={`Adicionar ${displayProduct?.name || 'produto'} à lista`}
        >
          Add a Lista
        </button>
      </div>
    </div>
  );
};

export { FeaturedProductDisplay };
