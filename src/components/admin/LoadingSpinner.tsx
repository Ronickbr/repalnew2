import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'gray' | 'white' | 'green' | 'red';
  className?: string;
  ariaLabel?: string;
  ariaLive?: 'off' | 'polite' | 'assertive';
  ariaBusy?: boolean;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  className = '',
  ariaLabel = 'Carregando',
  ariaLive = 'polite',
  ariaBusy = true,
  message
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'md':
        return 'h-6 w-6';
      case 'lg':
        return 'h-8 w-8';
      case 'xl':
        return 'h-12 w-12';
      default:
        return 'h-6 w-6';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'gray':
        return 'text-gray-600';
      case 'white':
        return 'text-white';
      case 'green':
        return 'text-green-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div
        role="status"
        aria-label={ariaLabel}
        aria-live={ariaLive}
        aria-busy={ariaBusy}
        className="inline-flex items-center"
      >
        <svg
          className={`animate-spin ${getSizeClasses()} ${getColorClasses()}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="sr-only">{ariaLabel}</span>
      </div>
      {message && (
        <span className="ml-2 text-sm text-gray-600" aria-hidden="true">
          {message}
        </span>
      )}
    </div>
  );
};

export interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  ariaLabel?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Carregando...',
  ariaLabel = 'Carregando conteúdo',
  className = ''
}) => {
  if (!isLoading) return null;

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-live="polite"
      aria-busy="true"
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
    >
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <LoadingSpinner
            size="lg"
            color="blue"
            ariaLabel="Carregando"
          />
          <div>
            <p className="text-gray-900 font-medium">{message}</p>
            <p className="text-sm text-gray-500 mt-1">Por favor, aguarde...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  loadingText = 'Carregando...',
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  onClick,
  ariaLabel
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 focus:ring-gray-500 text-gray-900';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-label={ariaLabel || (isLoading ? loadingText : undefined)}
      aria-busy={isLoading}
      className={`inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getVariantClasses()} ${getSizeClasses()} ${className}`}
    >
      {isLoading ? (
        <>
          <LoadingSpinner
            size="sm"
            color={variant === 'secondary' ? 'gray' : 'white'}
            className="mr-2"
            ariaLabel="Carregando"
          />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Componente de esqueleto para carregamento de conteúdo
export interface SkeletonProps {
  lines?: number;
  className?: string;
  ariaLabel?: string;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  lines = 3,
  className = '',
  ariaLabel = 'Carregando conteúdo'
}) => {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      aria-busy="true"
      className={`animate-pulse ${className}`}
    >
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="mb-2">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};