import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { logActivity, supabase } from '../lib/supabase';
import { isLikelyBot } from '../lib/utils';

export interface Store {
  id: string | number;
  name: string;
  phone: string;
  displayPhone: string;
}

interface WhatsAppContextType {
  isModalOpen: boolean;
  stores: Store[];
  loading: boolean;
  currentMessage?: string;
  openStoreSelector: (message?: string) => void;
  closeStoreSelector: () => void;
  redirectToWhatsApp: (store: Store, message?: string) => void;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const WhatsAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, whatsapp_number, phone, active')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      if (data) {
        const formattedStores: Store[] = data.map((store: any) => ({
          id: store.id,
          name: store.name,
          phone: store.whatsapp_number?.replace(/\D/g, '') || '',
          displayPhone: store.whatsapp_number || store.phone || ''
        }));
        setStores(formattedStores);
      }
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      // Fallback para lojas padrão em caso de erro
      setStores([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openStoreSelector = useCallback((message?: string) => {
    setCurrentMessage(message);
    setIsModalOpen(true);
  }, []);

  const closeStoreSelector = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const redirectToWhatsApp = useCallback((store: Store, message: string = 'Olá, gostaria de mais informações') => {
    const whatsappUrl = `https://wa.me/${store.phone}?text=${encodeURIComponent(message)}`;
    if (!isLikelyBot()) {
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
        resource_id: String(store.id),
        details: JSON.stringify(details),
        user_agent: navigator.userAgent,
        status: 'success',
      });
    }
    window.open(whatsappUrl, '_blank');
    closeStoreSelector();
  }, [closeStoreSelector]);

  const value = useMemo(() => ({
    isModalOpen,
    stores,
    loading,
    currentMessage,
    openStoreSelector,
    closeStoreSelector,
    redirectToWhatsApp
  }), [isModalOpen, stores, loading, currentMessage, openStoreSelector, closeStoreSelector, redirectToWhatsApp]);

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
