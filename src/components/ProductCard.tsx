import React, { memo } from 'react';
import { Search, DollarSign } from 'lucide-react';
import { ProductWithCategory } from '../types/product';

interface ProductCardProps {
  product: ProductWithCategory;
  viewMode?: 'grid' | 'list';
  onAddToCart?: (product: ProductWithCategory) => void;
  onViewDetails?: (product: ProductWithCategory) => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  viewMode = 'grid',
  // onAddToCart, // removido pois não está sendo usado
  onViewDetails,
  className = ''
}) => {




  const handleViewDetails = () => {
    onViewDetails?.(product);
  };



  const getProductImage = () => {
    if (product.product_images && product.product_images.length > 0) {
      return product.product_images[0].image_url;
    }
    return null;
  };

  const getProductInitial = () => {
    return (product.product_name || 'P').charAt(0).toUpperCase();
  };

  if (viewMode === 'list') {
    return (
      <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-red-200 p-4 cursor-pointer group ${className}`}>
        <div className="flex items-center gap-4">
          {/* Imagem do Produto em alta resolução */}
          <div className="relative w-36 h-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {getProductImage() ? (
              <img
                src={getProductImage()!}
                alt={product.product_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-product.png';
                  target.alt = 'Imagem indisponível';
                }}
              />
            ) : (
              <div className="text-gray-400 text-xl font-bold">
                {getProductInitial()}
              </div>
            )}
          </div>
          
          {/* Informações do Produto */}
          <div className="flex-1 min-w-0 p-5">
            {/* Nome/título em destaque (18px, negrito) */}
            <h3 className="font-bold text-gray-900 mb-4 leading-tight" style={{ fontSize: '18px' }}>
              {product.product_name}
            </h3>

            {/* Container dos botões com espaçamento uniforme (16px) - um abaixo do outro */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
              {/* Botão Ver Detalhes com ícone de lupa */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails();
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#D0021B] text-white font-medium rounded-lg hover:bg-[#b80218] active:bg-[#9e0215] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D0021B] focus:ring-opacity-50"
                aria-label={`Ver detalhes de ${product.product_name}`}
              >
                <Search className="w-4 h-4" />
                <span>Ver Detalhes</span>
              </button>
              
              {/* Botão Solicitar Orçamento com ícone de cifrão */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/contato?produto=${product.id}`;
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white font-medium rounded-lg hover:bg-[#20b85a] active:bg-[#1ba04e] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-opacity-50"
                aria-label={`Solicitar orçamento para ${product.product_name}`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Solicitar Orçamento</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100 hover:border-red-100 ${className}`}>
      {/* Imagem do Produto em alta resolução */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {getProductImage() ? (
          <img
            src={getProductImage()!}
            alt={product.product_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-product.png';
              target.alt = 'Imagem indisponível';
            }}
          />
        ) : (
          <div className="text-gray-400 text-4xl font-bold">
            {getProductInitial()}
          </div>
        )}
        
        {/* Overlay com ações */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className="p-3 bg-white/95 text-gray-600 hover:text-red-600 rounded-full backdrop-blur-sm transition-all duration-200 transform hover:scale-110 shadow-md hover:bg-white"
            aria-label="Ver detalhes"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Informações do Produto com padding uniforme (16px) */}
      <div className="p-4">
        {/* Nome/título em destaque (18px, negrito) */}
        <h3 className="font-bold text-gray-900 mb-4 leading-tight" style={{ fontSize: '18px' }}>
          {product.product_name}
        </h3>

        {/* Container dos botões com espaçamento uniforme - um abaixo do outro */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
          {/* Botão Ver Detalhes com ícone de lupa */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#D0021B] text-white font-medium rounded-lg hover:bg-[#b80218] active:bg-[#9e0215] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D0021B] focus:ring-opacity-50"
            aria-label={`Ver detalhes de ${product.product_name}`}
          >
            <Search className="w-4 h-4" />
            <span>Ver Detalhes</span>
          </button>
          
          {/* Botão Solicitar Orçamento com ícone de cifrão */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/contato?produto=${product.id}`;
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white font-medium rounded-lg hover:bg-[#20b85a] active:bg-[#1ba04e] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-opacity-50"
            aria-label={`Solicitar orçamento para ${product.product_name}`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Solicitar Orçamento</span>
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;