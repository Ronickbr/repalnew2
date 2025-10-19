import React, { memo } from 'react';
import { ChefHat, UtensilsCrossed } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({
  size = 'md',
  variant = 'primary',
  text,
  className = '',
  fullScreen = false
}) => {
  // Aumentei ligeiramente os tamanhos padrão para os ícones de cozinha ficarem mais visíveis
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const variantClasses = {
    primary: 'text-red-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* Container principal com overflow-visible para não cortar o chapéu escalonado */}
      <div className={`relative ${sizeClasses[size]} overflow-visible`}>
        {/* Chapéu de Chef escalonado para 2x o tamanho */}
        <div className="absolute inset-0 flex items-center justify-center scale-[2]">
          <ChefHat className={`w-full h-full ${variantClasses[variant]}`} />
        </div>
        {/* Talheres girando sobre o chapéu */}
        <div className="absolute inset-0 flex items-center justify-center">
          <UtensilsCrossed className={`w-3/5 h-3/5 ${variantClasses[variant]} animate-spin`} />
        </div>
      </div>
      {text && (
        <p className={`${textSizeClasses[size]} ${variantClasses[variant]} font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;

// Componente para skeleton loading de produtos
export const ProductSkeleton: React.FC<{ viewMode?: 'grid' | 'list' }> = memo(({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="flex justify-between items-center">
              <div className="h-5 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex justify-between items-center">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-8 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
});

ProductSkeleton.displayName = 'ProductSkeleton';

// Componente para grid de skeletons
export const ProductGridSkeleton: React.FC<{ 
  count?: number; 
  viewMode?: 'grid' | 'list';
}> = memo(({ count = 8, viewMode = 'grid' }) => {
  return (
    <div className={viewMode === 'grid' 
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      : "space-y-4"
    }>
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} viewMode={viewMode} />
      ))}
    </div>
  );
});

ProductGridSkeleton.displayName = 'ProductGridSkeleton';