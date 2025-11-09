import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface BudgetItem {
  id: string;
  name: string;
  image?: string;
  quantity: number;
  addedAt: Date;
}

interface BudgetState {
  items: BudgetItem[];
  totalItems: number;
}

interface BudgetContextType {
  state: BudgetState;
  addItem: (item: Omit<BudgetItem, 'quantity' | 'addedAt'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearBudget: () => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

type BudgetAction =
  | { type: 'ADD_ITEM'; payload: BudgetItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_BUDGET' }
  | { type: 'LOAD_FROM_STORAGE'; payload: BudgetItem[] };

const budgetReducer = (state: BudgetState, action: BudgetAction): BudgetState => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        // Se o item já existe, incrementa a quantidade
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        };
      } else {
        // Se é um novo item, adiciona à lista
        const newItems = [...state.items, action.payload];
        return {
          ...state,
          items: newItems,
          totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0)
        };
      }

    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: filteredItems,
        totalItems: filteredItems.reduce((sum, item) => sum + item.quantity, 0)
      };

    case 'UPDATE_QUANTITY':
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      };

    case 'CLEAR_BUDGET':
      return {
        items: [],
        totalItems: 0
      };

    case 'LOAD_FROM_STORAGE':
      return {
        items: action.payload,
        totalItems: action.payload.reduce((sum, item) => sum + item.quantity, 0)
      };

    default:
      return state;
  }
};

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(budgetReducer, {
    items: [],
    totalItems: 0
  });

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    const loadBudgetFromStorage = () => {
      try {
        const stored = localStorage.getItem('budget-items');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Converter strings de data de volta para objetos Date
          const itemsWithDates = parsed.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt)
          }));
          dispatch({ type: 'LOAD_FROM_STORAGE', payload: itemsWithDates });
        }
      } catch (error) {
        console.error('Erro ao carregar orçamento do localStorage:', error);
      }
    };

    loadBudgetFromStorage();
  }, []);

  // Salvar no localStorage sempre que o estado mudar
  useEffect(() => {
    try {
      localStorage.setItem('budget-items', JSON.stringify(state.items));
    } catch (error) {
      console.error('Erro ao salvar orçamento no localStorage:', error);
    }
  }, [state.items]);

  const addItem = (item: Omit<BudgetItem, 'quantity' | 'addedAt'>) => {
    const newItem: BudgetItem = {
      ...item,
      quantity: 1,
      addedAt: new Date()
    };
    dispatch({ type: 'ADD_ITEM', payload: newItem });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearBudget = () => {
    dispatch({ type: 'CLEAR_BUDGET' });
  };

  const value: BudgetContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearBudget
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget deve ser usado dentro de um BudgetProvider');
  }
  return context;
};