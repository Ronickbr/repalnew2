import React from 'react';
import { X, MessageCircle } from 'lucide-react';
import { useWhatsAppStore, Store } from '../contexts/WhatsAppContext';

interface WhatsAppStoreSelectorProps {
  message?: string;
}

const WhatsAppStoreSelector: React.FC<WhatsAppStoreSelectorProps> = ({ 
  message = 'Olá, gostaria de mais informações' 
}) => {
  const { isModalOpen, stores, currentMessage, closeStoreSelector, redirectToWhatsApp } = useWhatsAppStore();

  if (!isModalOpen) return null;

  const handleStoreSelect = (store: Store) => {
    const messageToSend = currentMessage || message;
    redirectToWhatsApp(store, messageToSend);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeStoreSelector();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-600" />
            Qual loja você quer falar?
          </h2>
          <button
            onClick={closeStoreSelector}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Options */}
        <div className="p-6 space-y-4">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => handleStoreSelect(store)}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800 group-hover:text-green-700">
                    {store.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {store.displayPhone}
                  </p>
                </div>
              </div>
              <div className="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 text-center">
            Você será redirecionado para o WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppStoreSelector;