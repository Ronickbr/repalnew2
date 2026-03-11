import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { Product } from '../lib/supabase';



interface FilterState {
  searchTerm: string;
  selectedCategory: string;
  selectedSubcategory: string;
  sortBy: string;
  showFeaturedOnly: boolean;
  showHomepageFeatured: boolean;
  hideDisabled: boolean;
}

interface UseFiltersReturn {
  filters: FilterState;
  filteredProducts: Product[];
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedSubcategory: (subcategory: string) => void;
  setSortBy: (sort: string) => void;
  setShowFeaturedOnly: (show: boolean) => void;
  setShowHomepageFeatured: (show: boolean) => void;
  setHideDisabled: (hide: boolean) => void;
  clearFilters: () => void;
  totalResults: number;
}

const initialFilters: FilterState = {
  searchTerm: '',
  selectedCategory: 'all',
  selectedSubcategory: '',
  sortBy: 'name',
  showFeaturedOnly: false,
  showHomepageFeatured: false,
  hideDisabled: true
};

export const useFilters = (products: Product[]): UseFiltersReturn => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  
  // Debounce search term para melhor performance
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const setSelectedCategory = useCallback((category: string) => {
    setFilters(prev => ({ 
      ...prev, 
      selectedCategory: category,
      selectedSubcategory: '' // Reset subcategory when category changes
    }));
  }, []);

  const setSelectedSubcategory = useCallback((subcategory: string) => {
    setFilters(prev => ({ ...prev, selectedSubcategory: subcategory }));
  }, []);



  const setSortBy = useCallback((sort: string) => {
    setFilters(prev => ({ ...prev, sortBy: sort }));
  }, []);

  const setShowFeaturedOnly = useCallback((show: boolean) => {
    setFilters(prev => ({ ...prev, showFeaturedOnly: show }));
  }, []);

  const setShowHomepageFeatured = useCallback((show: boolean) => {
    setFilters(prev => ({ ...prev, showHomepageFeatured: show }));
  }, []);

  const setHideDisabled = useCallback((hide: boolean) => {
    setFilters(prev => ({ ...prev, hideDisabled: hide }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtro por busca
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por categoria usando slug
    if (filters.selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category?.slug === filters.selectedCategory
      );
    }

    // Filtro por subcategoria usando slug
    if (filters.selectedSubcategory) {
      filtered = filtered.filter(product => 
        product.subcategory?.slug === filters.selectedSubcategory
      );
    }

    // Filtros baseados nos novos campos booleanos
    if (filters.hideDisabled) {
      filtered = filtered.filter(product => !product.is_disabled);
    }

    if (filters.showFeaturedOnly) {
      filtered = filtered.filter(product => product.featured_in_dropdown);
    }

    if (filters.showHomepageFeatured) {
      filtered = filtered.filter(product => product.featured_on_homepage);
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');

        default:
          return 0;
      }
    });

    return filtered;
  }, [products, debouncedSearchTerm, filters.selectedCategory, filters.selectedSubcategory, filters.sortBy, filters.hideDisabled, filters.showFeaturedOnly, filters.showHomepageFeatured]);

  return {
    filters,
    filteredProducts,
    setSearchTerm,
    setSelectedCategory,
    setSelectedSubcategory,
    setSortBy,
    setShowFeaturedOnly,
    setShowHomepageFeatured,
    setHideDisabled,
    clearFilters,
    totalResults: filteredProducts.length
  };
};

export default useFilters;