import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProducts } from './useProducts';
import { useDebounce } from './useDebounce';
import type { ProductWithCategory } from '../types/product';

export type SearchResult = ProductWithCategory;

export const useProductSearch = (query: string) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);
  const { data: products, isLoading: productsLoading } = useProducts();
  
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
        // Verificar se o produto está ativo e não desabilitado
        if (product.is_disabled) return false;
        
        const productName = product.name?.toLowerCase() || ''
        const description = product.description?.toLowerCase() || ''
        const benefits = product.benefits?.toLowerCase() || ''
        
        // Verificar categoria (suporta tanto 'category' quanto 'categories')
        const categoryName = (product.category?.name || product.categories?.name || '').toLowerCase()
        const subcategoryName = product.subcategory?.name?.toLowerCase() || ''
        
        return productName.includes(searchTerm) || 
               description.includes(searchTerm) ||
               benefits.includes(searchTerm) ||
               categoryName.includes(searchTerm) ||
               subcategoryName.includes(searchTerm)
      })
      .slice(0, 10) // Limitar a 10 resultados
      .map(product => {
        // Garantir que o produto tenha a estrutura correta para o SearchDropdown
        return {
          ...product,
          slug: product.slug || `produto-${product.id}`,
          product_images: product.product_images || (product.image_url ? [{
            id: '1',
            product_id: product.id,
            image_url: product.image_url,
            sort_order: 1,
            created_at: new Date().toISOString()
          }] : [])
        } as SearchResult
      })
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