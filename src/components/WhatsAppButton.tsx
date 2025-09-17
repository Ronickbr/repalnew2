import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useWhatsAppStore } from '../contexts/WhatsAppContext';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
  children?: React.ReactNode;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  message,
  className = '',
  children
}) => {
  const { openStoreSelector } = useWhatsAppStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openStoreSelector(message);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200
        bg-green-600 hover:bg-green-700 text-white px-4 py-2
        ${className}
      `}
    >
      <MessageCircle className="w-5 h-5" />
      {children || 'WhatsApp'}
    </button>
  );
};

export default WhatsAppButton;