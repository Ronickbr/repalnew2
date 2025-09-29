import React, { memo } from 'react';
import { Eye } from 'lucide-react';
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
      <div 
        className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-red-200 p-4 cursor-pointer group ${className}`}
        onClick={handleViewDetails}
      >
        <div className="flex items-center gap-4">
          {/* Imagem do Produto */}
          <div className="relative w-36 h-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {getProductImage() ? (
              <img
                src={getProductImage()!}
                alt={product.product_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="text-gray-400 text-xl font-bold">
                {getProductInitial()}
              </div>
            )}
            

          </div>
          
          {/* Informações do Produto */}
          <div className="flex-1 min-w-0 p-5">
            <h3 className="font-bold text-lg text-gray-900 mb-2 truncate group-hover:text-red-600 transition-colors">
              {product.product_name}
            </h3>

            <div className="flex items-center justify-center pt-3 border-t border-gray-100">
              <button
                onClick={handleViewDetails}
                className="px-5 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-lg hover:from-red-50 hover:to-red-100 hover:text-red-600 transition-all duration-200 text-sm font-semibold border border-gray-200 hover:border-red-200"
                aria-label="Ver detalhes do produto"
              >
                Ver Detalhes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100 hover:border-red-100 ${className}`}
      onClick={handleViewDetails}
    >
      {/* Imagem do Produto */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {getProductImage() ? (
          <img
            src={getProductImage()!}
            alt={product.product_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="text-gray-400 text-4xl font-bold">
            {getProductInitial()}
          </div>
        )}
        
        {/* Overlay com ações */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={handleViewDetails}
            className="p-3 bg-white/95 text-gray-600 hover:text-red-600 rounded-full backdrop-blur-sm transition-all duration-200 transform hover:scale-110 shadow-md hover:bg-white"
            aria-label="Ver detalhes"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
        
        {/* Badge removido conforme solicitação */}
      </div>
      
      {/* Informações do Produto */}
      <div className="p-6">
        <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-red-600 transition-colors leading-tight">
          {product.product_name}
        </h3>

        <div className="flex items-center justify-center pt-2 border-t border-gray-100">
          <button
            onClick={handleViewDetails}
            className="px-5 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-lg hover:from-red-50 hover:to-red-100 hover:text-red-600 transition-all duration-200 text-sm font-semibold border border-gray-200 hover:border-red-200"
            aria-label="Ver detalhes do produto"
          >
            Ver Detalhes
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;