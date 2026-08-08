import React, { memo, useCallback, useMemo } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import { ProductWithCategory } from '../types/product';
import { useBudgetActions, useIsProductInBudget } from '../contexts/BudgetContext';
import { useAuth } from '../hooks/useAuth';
import OptimizedImage from './OptimizedImage';
import { queryClient, queryKeys } from '../lib/react-query';

interface ProductCardProps {
  product: ProductWithCategory;
  viewMode?: 'grid' | 'list';
  onAddToCart?: (product: ProductWithCategory) => void;
  onViewDetails?: (product: ProductWithCategory) => void;
  className?: string;
}

function ProductCardInner({
  product,
  viewMode = 'grid',
  onViewDetails,
  className = ''
}: ProductCardProps) {
  const isAddedToBudget = useIsProductInBudget(product.id);
  const { addItem } = useBudgetActions();
  const { isAuthenticated } = useAuth();

  const handleAddToBudget = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: product.id.toString(),
      name: product.name,
      image: product.product_images?.[0]?.image_url || product.image_url || '/placeholder-product.png'
    });
  }, [addItem, product.id, product.name, product.product_images, product.image_url]);

  const handleViewDetails = useCallback(() => {
    onViewDetails?.(product);
  }, [onViewDetails, product]);

  const handleDetailsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const slug = product.slug || String(product.id);
    try {
      queryClient.prefetchQuery({
        queryKey: queryKeys.products.bySlug(slug),
      }).catch(() => undefined);
    } catch {
      /* noop */
    }
    handleViewDetails();
  }, [handleViewDetails, product.id, product.slug]);

  const productImageSrc = useMemo(() => {
    if (product.product_images && product.product_images.length > 0) {
      return product.product_images[0].image_url;
    }
    return null;
  }, [product.product_images]);

  const productInitial = useMemo(() => (
    (product.name || 'P').charAt(0).toUpperCase()
  ), [product.name]);

  const formattedPrice = useMemo(() => {
    if (!isAuthenticated) return null;
    if (!product.price || product.price <= 0) return 'Sob Consulta';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price);
  }, [isAuthenticated, product.price]);

  const imagePlaceholder = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (target.dataset.fallbackSet) return;
    target.dataset.fallbackSet = '1';
    target.src = '/placeholder-product.png';
    target.alt = 'Imagem indisponível';
  }, []);

  if (viewMode === 'list') {
    return (
      <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-red-200 p-3 sm:p-4 cursor-pointer group ${className}`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-lg flex-shrink-0 overflow-hidden">
            {productImageSrc ? (
              <OptimizedImage
                src={productImageSrc}
                alt={product.name}
                variant="card"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                width={144}
                height={144}
                onError={imagePlaceholder}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-gray-400 text-lg sm:text-xl md:text-2xl font-bold">
                  {productInitial}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 p-2 sm:p-3 md:p-5">
            <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 leading-tight text-base sm:text-lg md:text-xl">
              {product.name}
            </h3>

            {formattedPrice && (
              <div className="font-bold text-[#D0021B] mb-2 sm:mb-3 text-base sm:text-lg">
                {formattedPrice}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4 border-t border-gray-100">
              <button
                onClick={handleDetailsClick}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-[#D0021B] text-white font-medium rounded-lg hover:bg-[#b80218] active:bg-[#9e0215] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D0021B] focus:ring-opacity-50 text-sm sm:text-base"
                aria-label={`Ver detalhes de ${product.name}`}
              >
                <Search className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Ver Detalhes</span>
              </button>

              <button
                onClick={handleAddToBudget}
                disabled={isAddedToBudget}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm sm:text-base ${isAddedToBudget
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
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {productImageSrc ? (
          <OptimizedImage
            src={productImageSrc}
            alt={product.name}
            variant="card"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            width={300}
            height={300}
            onError={imagePlaceholder}
          />
        ) : (
          <div className="text-gray-400 text-2xl sm:text-3xl md:text-4xl font-bold">
            {productInitial}
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={handleDetailsClick}
            className="p-2 sm:p-3 bg-white/95 text-gray-600 hover:text-red-600 rounded-full backdrop-blur-sm transition-all duration-200 transform hover:scale-110 shadow-md hover:bg-white"
            aria-label="Ver detalhes"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 leading-tight text-sm sm:text-base md:text-lg">
          {product.name}
        </h3>

        {formattedPrice && (
          <div className="font-bold text-[#D0021B] mb-2 sm:mb-3 text-base sm:text-lg">
            {formattedPrice}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4 border-t border-gray-100">
          <button
            onClick={handleDetailsClick}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-[#D0021B] text-white font-medium rounded-lg hover:bg-[#b80218] active:bg-[#9e0215] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D0021B] focus:ring-opacity-50 text-sm sm:text-base"
            aria-label={`Ver detalhes de ${product.name}`}
          >
            <Search className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Ver Detalhes</span>
          </button>

          <button
            onClick={handleAddToBudget}
            disabled={isAddedToBudget}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm sm:text-base ${isAddedToBudget
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
  );
}

const propsAreEqual = (prev: ProductCardProps, next: ProductCardProps): boolean => {
  if (prev.viewMode !== next.viewMode) return false;
  if (prev.className !== next.className) return false;
  if (!!prev.onViewDetails !== !!next.onViewDetails) return false;
  const prevId = typeof prev.product.id === 'number' ? prev.product.id : String(prev.product.id);
  const nextId = typeof next.product.id === 'number' ? next.product.id : String(next.product.id);
  if (prevId !== nextId) return false;
  if (prev.product.updated_at !== next.product.updated_at) return false;
  if (prev.product.price !== next.product.price) return false;
  if (prev.product.name !== next.product.name) return false;
  if (prev.product.image_url !== next.product.image_url) return false;
  return true;
};

const MemoizedProductCard = memo(ProductCardInner, propsAreEqual);
(MemoizedProductCard as React.FC<ProductCardProps> & { displayName: string }).displayName = 'ProductCard';

export default MemoizedProductCard as React.FC<ProductCardProps>;
