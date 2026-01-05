import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type PopupType = 'info' | 'lead' | 'promo' | null;

interface PopupConfig {
  type: PopupType;
  title?: string;
  message?: string;
  image?: string;
  link?: string;
  data?: any; // For custom data like product details
  delay?: number; // Auto close delay
}

interface PopupContextType {
  activePopup: PopupConfig | null;
  showPopup: (config: PopupConfig) => void;
  hidePopup: () => void;
  isPopupVisible: boolean;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export function PopupProvider({ children }: { children: ReactNode }) {
  const [activePopup, setActivePopup] = useState<PopupConfig | null>(null);

  const showPopup = useCallback((config: PopupConfig) => {
    setActivePopup(config);
  }, []);

  const hidePopup = useCallback(() => {
    setActivePopup(null);
  }, []);

  return (
    <PopupContext.Provider value={{ 
        activePopup, 
        showPopup, 
        hidePopup, 
        isPopupVisible: !!activePopup 
    }}>
      {children}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const context = useContext(PopupContext);
  if (context === undefined) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
}
