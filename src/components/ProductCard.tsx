import React, { memo, useState, useEffect } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import { ProductWithCategory } from '../types/product';
import { useBudget } from '../contexts/BudgetContext';
import { useAuth } from '../hooks/useAuth';
import OptimizedImage from './OptimizedImage';

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

  const { state, addItem } = useBudget();
  const { isAuthenticated } = useAuth();
  const [isAddedToBudget, setIsAddedToBudget] = useState(false);

  // Verifica se o produto já está na lista
  useEffect(() => {
    const isInBudget = state.items && Array.isArray(state.items) && state.items.some(item => item.id === product.id);
    setIsAddedToBudget(!!isInBudget);
  }, [state.items, product.id]);

  const handleAddToBudget = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    
    
    addItem({
      id: product.id.toString(),
      name: product.name,
      image: product.product_images?.[0]?.image_url || product.image_url || '/placeholder-product.png'
    });
    
    
    
    setIsAddedToBudget(true);
  };

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
    return (product.name || 'P').charAt(0).toUpperCase();
  };

  if (viewMode === 'list') {
    return (
      <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-red-200 p-3 sm:p-4 cursor-pointer group ${className}`}>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Imagem do Produto em alta resolução */}
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-lg flex-shrink-0 overflow-hidden">
            {getProductImage() ? (
              <OptimizedImage
                src={getProductImage()!}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                width={144}
                height={144}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-product.png';
                  target.alt = 'Imagem indisponível';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-gray-400 text-lg sm:text-xl md:text-2xl font-bold">
                  {getProductInitial()}
                </div>
              </div>
            )}
          </div>
          
          {/* Informações do Produto */}
          <div className="flex-1 min-w-0 p-2 sm:p-3 md:p-5">
            {/* Nome/título em destaque com tamanho responsivo */}
            <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 leading-tight text-base sm:text-lg md:text-xl">
              {product.name}
            </h3>

            {isAuthenticated && product.price !== undefined && (
              <div className="font-bold text-[#D0021B] mb-2 sm:mb-3 text-base sm:text-lg">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
              </div>
            )}

            {/* Container dos botões com espaçamento responsivo */}
            <div className="flex flex-col gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4 border-t border-gray-100">
              {/* Botão Ver Detalhes com ícone de lupa */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails();
                }}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-[#D0021B] text-white font-medium rounded-lg hover:bg-[#b80218] active:bg-[#9e0215] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D0021B] focus:ring-opacity-50 text-sm sm:text-base"
                aria-label={`Ver detalhes de ${product.name}`}
              >
                <Search className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Ver Detalhes</span>
              </button>
              
              {/* Botão Incluir na Lista com ícone de + */}
              <button
                onClick={handleAddToBudget}
                disabled={isAddedToBudget}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm sm:text-base ${
                  isAddedToBudget
                    ? 'bg-green-600 text-white cursor-not-allowed focus:ring-green-600'
                    : 'bg-[#25D366] text-white hover:bg-[#20b85a] active:bg-[#1ba04e] focus:ring-[#25D366]'
                }`}
                aria-label={`${isAddedToBudget ? 'Adicionado à lista' : 'Incluir na lista'} para ${product.name}`}
              >
                {isAddedToBudget ? (
                  <>
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Adicionado</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>Incluir na Lista</span>
                  </>
                )}
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
          <OptimizedImage
            src={getProductImage()!}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            width={300}
            height={300}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-product.png';
              target.alt = 'Imagem indisponível';
            }}
          />
        ) : (
          <div className="text-gray-400 text-2xl sm:text-3xl md:text-4xl font-bold">
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
            className="p-2 sm:p-3 bg-white/95 text-gray-600 hover:text-red-600 rounded-full backdrop-blur-sm transition-all duration-200 transform hover:scale-110 shadow-md hover:bg-white"
            aria-label="Ver detalhes"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
      
      {/* Informações do Produto com padding responsivo */}
      <div className="p-3 sm:p-4">
        {/* Nome/título em destaque com tamanho responsivo */}
        <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 leading-tight text-sm sm:text-base md:text-lg">
          {product.name}
        </h3>

        {isAuthenticated && product.price !== undefined && (
          <div className="font-bold text-[#D0021B] mb-2 sm:mb-3 text-base sm:text-lg">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
          </div>
        )}

        {/* Container dos botões com espaçamento responsivo */}
        <div className="flex flex-col gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4 border-t border-gray-100">
          {/* Botão Ver Detalhes com ícone de lupa */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-[#D0021B] text-white font-medium rounded-lg hover:bg-[#b80218] active:bg-[#9e0215] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D0021B] focus:ring-opacity-50 text-sm sm:text-base"
            aria-label={`Ver detalhes de ${product.name}`}
          >
            <Search className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Ver Detalhes</span>
          </button>
          
          {/* Botão Incluir na Lista com ícone de + */}
          <button
            onClick={handleAddToBudget}
            disabled={isAddedToBudget}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm sm:text-base ${
              isAddedToBudget
                ? 'bg-green-600 text-white cursor-not-allowed focus:ring-green-600'
                : 'bg-[#25D366] text-white hover:bg-[#20b85a] active:bg-[#1ba04e] focus:ring-[#25D366]'
            }`}
            aria-label={`${isAddedToBudget ? 'Adicionado à lista' : 'Incluir na lista'} para ${product.name}`}
          >
            {isAddedToBudget ? (
              <>
                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate">Adicionado</span>
              </>
            ) : (
              <>
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Incluir na Lista</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
