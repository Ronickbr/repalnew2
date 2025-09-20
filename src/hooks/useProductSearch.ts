import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProducts } from './useProducts';
import { useDebounce } from './useDebounce';
import type { ProductWithCategory } from '../types/product';

export type SearchResult = ProductWithCategory;

export const useProductSearch = (query: string) => {
  console.log('🔍 useProductSearch: Hook inicializado com query:', query);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);
  const { data: products, isLoading: productsLoading } = useProducts();
  
  console.log('🔍 useProductSearch: Produtos recebidos do useProducts:', products?.length || 0, 'loading:', productsLoading);
  
  // Função para filtrar produtos baseado na query
  const filteredProducts = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) {
      return []
    }
    
    if (!products || products.length === 0) {
      return []
    }
    
    const searchTerm = debouncedQuery.toLowerCase().trim()
    
    return products
      .filter(product => {
        const productName = product.product_name?.toLowerCase() || ''
        const categoryName = product.categories?.name?.toLowerCase() || ''
        const subcategoryName = product.subcategory?.name?.toLowerCase() || ''
        
        return productName.includes(searchTerm) || 
               categoryName.includes(searchTerm) ||
               subcategoryName.includes(searchTerm)
      })
      .slice(0, 10) // Limitar a 10 resultados
      .map(product => product as SearchResult)
  }, [debouncedQuery, products])
  
  // Efeito para atualizar resultados e estados
  const updateResults = useCallback(() => {
    if (debouncedQuery && debouncedQuery.length >= 3) {
      setIsSearching(true)
      setHasSearched(true)
      
      // Simular delay de busca
      const timer = setTimeout(() => {
        setSearchResults(filteredProducts)
        setIsSearching(false)
      }, 100)
      
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
      setIsSearching(false)
      if (debouncedQuery === '') {
        setHasSearched(false)
      }
    }
  }, [debouncedQuery, filteredProducts])

  useEffect(() => {
    return updateResults()
  }, [updateResults])
  
  // Efeito para resetar estado quando query muda
  useEffect(() => {
    if (query !== debouncedQuery) {
      setIsSearching(true)
    }
  }, [query, debouncedQuery])
  
  return useMemo(() => ({
    searchResults,
    isSearching: isSearching || productsLoading,
    hasSearched,
    isEmpty: hasSearched && searchResults.length === 0 && !isSearching
  }), [searchResults, isSearching, productsLoading, hasSearched])
};