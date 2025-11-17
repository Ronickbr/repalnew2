import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, Send, Trash2 } from 'lucide-react';
import { useBudget } from '../contexts/BudgetContext';
import { useWhatsAppStore } from '../contexts/WhatsAppContext';

interface SideQuoteListProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideQuoteList: React.FC<SideQuoteListProps> = ({ isOpen, onClose }) => {
  const { state, removeItem, updateQuantity, clearBudget } = useBudget();
  const { openStoreSelector } = useWhatsAppStore();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = () => {
    onClose();
  };

  const handleSendToWhatsApp = () => {
    if (state.items.length === 0) {
      alert('Sua lista de orçamento está vazia!');
      return;
    }

    try {
      // Gerar mensagem do orçamento
      const message = state.items.map(item => 
        `• ${item.name} - Quantidade: ${item.quantity}`
      ).join('\n');
      
      const fullMessage = `Olá, gostaria de solicitar um orçamento para os seguintes itens:\n\n${message}\n\nTotal de itens: ${state.totalItems}`;
      
      openStoreSelector(fullMessage);
      onClose();
    } catch (error) {
      console.error('Erro ao enviar orçamento:', error);
      alert('Erro ao enviar orçamento. Tente novamente.');
    }
  };

  const handleClearList = () => {
    if (window.confirm('Tem certeza que deseja limpar toda a lista?')) {
      clearBudget();
    }
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div 
      className={`fixed inset-0 z-[2000] transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Side Panel */}
      <div 
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-800">Minha Lista de Orçamento</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4">
            {state.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ShoppingCart className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-center text-lg font-medium">Sua lista está vazia</p>
                <p className="text-center text-sm mt-2">Adicione produtos ao orçamento para visualizá-los aqui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {state.items.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start space-x-3">
                      {/* Product Image */}
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </h3>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {state.items.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
              {/* Total Items */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total de itens:</span>
                <span className="font-medium text-gray-900">{state.totalItems}</span>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleSendToWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
                >
                  <Send className="h-5 w-5" />
                  <span>Enviar para WhatsApp</span>
                </button>
                
                <button
                  onClick={handleClearList}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Limpar Lista
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideQuoteList;
