import React, { useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  onClose?: (id: string) => void;
  actions?: NotificationAction[];
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationContainerProps {
  notifications: NotificationProps[];
  onClose: (id: string) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  maxVisible?: number;
}

const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  persistent = false,
  onClose,
  actions = [],
  // position = 'top-right'
}) => {
  const notificationRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const announceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Anunciar para leitores de tela
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', 'assertive');
      announceRef.current.setAttribute('aria-atomic', 'true');
    }

    // Auto-close se não for persistente
    if (!persistent && duration > 0) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, persistent]);

  const handleClose = () => {
    if (onClose) {
      onClose(id);
    }
  };

  const handleAction = (action: () => void) => {
    action();
    handleClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const getActionButtonClasses = (variant: string = 'secondary') => {
    const baseClasses = 'inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`;
      case 'danger':
        return `${baseClasses} border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`;
      default:
        return `${baseClasses} border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500`;
    }
  };

  return (
    <>
      {/* Elemento para anúncios de acessibilidade */}
      <div ref={announceRef} className="sr-only" aria-live="assertive" aria-atomic="true">
        {`${type === 'error' ? 'Erro' : type === 'success' ? 'Sucesso' : type === 'warning' ? 'Aviso' : 'Informação'}: ${title}. ${message}`}
      </div>
      
      <div
        ref={notificationRef}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        className={`max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border ${getBackgroundColor()} ${!persistent && duration > 0 ? 'pb-1' : ''}`}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 flex-1 min-w-0 pr-2">
              <h3 className={`text-sm font-medium ${getTextColor()} break-words leading-tight`}>
                {title}
              </h3>
              <div className={`mt-1 text-sm ${getTextColor()} break-words leading-relaxed`}>
                {message}
              </div>
              {actions.length > 0 && (
                <div className="mt-3 flex space-x-2">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleAction(action.action)}
                      className={getActionButtonClasses(action.variant)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                type="button"
                onClick={handleClose}
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex-shrink-0"
                aria-label="Fechar notificação"
              >
                <span className="sr-only">Fechar</span>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Barra de progresso para auto-close */}
        {!persistent && duration > 0 && (
          <div className="bg-gray-200 h-1">
            <div
              className={`h-full transition-all duration-100 ease-linear ${
                type === 'success' ? 'bg-green-500' :
                type === 'error' ? 'bg-red-500' :
                type === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              style={{
                animation: `progress ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
      
      {/* Estilos CSS para animação */}
      <style>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </>
  );
};

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose,
  position = 'top-right',
  maxVisible = 5
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4 mr-2';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4 mr-2';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-4 right-4 mr-2';
    }
  };

  // Limitar número de notificações visíveis
  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <div
      ref={containerRef}
      aria-live="polite"
      aria-atomic="false"
      className={`fixed z-50 space-y-2 ${getPositionClasses()} max-h-screen overflow-y-auto`}
    >
      {visibleNotifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={onClose}
          position={position}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;