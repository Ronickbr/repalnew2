import React, { createContext, useContext, useState, ReactNode } from 'react';
import { logActivity } from '../lib/supabase';

export interface Store {
  id: string;
  name: string;
  phone: string;
  displayPhone: string;
}

const stores: Store[] = [
  {
    id: 'curitiba',
    name: 'Loja Curitiba',
    phone: '5541999412928',
    displayPhone: '(41) 99941-2928'
  },
  {
    id: 'londrina',
    name: 'Loja Londrina',
    phone: '5543984446097',
    displayPhone: '(43) 98444-6097'
  }
];

interface WhatsAppContextType {
  isModalOpen: boolean;
  stores: Store[];
  currentMessage?: string;
  openStoreSelector: (message?: string) => void;
  closeStoreSelector: () => void;
  redirectToWhatsApp: (store: Store, message?: string) => void;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const WhatsAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>();

  const openStoreSelector = (message?: string) => {
    setCurrentMessage(message);
    setIsModalOpen(true);
  };

  const closeStoreSelector = () => {
    setIsModalOpen(false);
  };

  const redirectToWhatsApp = (store: Store, message: string = 'Olá, gostaria de mais informações') => {
    const whatsappUrl = `https://wa.me/${store.phone}?text=${encodeURIComponent(message)}`;
    const details = {
      store_id: store.id,
      store_name: store.name,
      phone: store.phone,
      path: window.location.pathname,
      message,
    };
    logActivity({
      action: 'whatsapp_click',
      resource_type: 'store',
      resource_id: store.id,
      details: JSON.stringify(details),
      user_agent: navigator.userAgent,
      status: 'success',
    })
    window.open(whatsappUrl, '_blank');
    closeStoreSelector();
  };

  const value = {
    isModalOpen,
    stores,
    currentMessage,
    openStoreSelector,
    closeStoreSelector,
    redirectToWhatsApp
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
};

export const useWhatsAppStore = () => {
  const context = useContext(WhatsAppContext);
  if (context === undefined) {
    throw new Error('useWhatsAppStore must be used within a WhatsAppProvider');
  }
  return context;
};
