import React from 'react';
import { useFeaturedProductByCategory } from '../hooks/useProducts';
import { Search } from 'lucide-react';

interface FeaturedProductDisplayProps {
  categoryId: string | number;
  isOpen: boolean;
}

const FeaturedProductDisplay: React.FC<FeaturedProductDisplayProps> = ({ categoryId, isOpen }) => {
  const { data: featuredProduct, isLoading } = useFeaturedProductByCategory(categoryId);

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

  if (!featuredProduct) {
    return (
      <div className="text-center p-4">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V9m0 0H7m9 0V6" />
          </svg>
        </div>
        <p className="text-base text-gray-500 font-medium">Produto em destaque em breve</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Imagem do produto em alta resolução */}
      <div className="relative overflow-hidden rounded-lg mb-4 group">
        <img
          src={featuredProduct.image_url || '/placeholder-product.png'}
          alt={featuredProduct.product_name}
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
      <h4 className="font-bold text-gray-900 mb-4 text-lg leading-tight line-clamp-2" style={{ fontSize: '18px' }}>
        {featuredProduct.product_name}
      </h4>
      
      {/* Botão Ver Detalhes */}
      <button
        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#2E86AB] text-white font-medium rounded-lg hover:bg-[#267399] active:bg-[#1f5e7f] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:ring-opacity-50"
        onClick={() => {
          // Navegar para página de detalhes do produto
          window.location.href = `/produto/${featuredProduct.id}`;
        }}
        aria-label={`Ver detalhes de ${featuredProduct.product_name}`}
      >
        <Search className="w-4 h-4" />
        <span>Ver Detalhes</span>
      </button>
    </div>
  );
};

export { FeaturedProductDisplay };