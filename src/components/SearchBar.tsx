import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useProductSearch, SearchResult } from '../hooks/useProductSearch';
import SearchDropdown from './SearchDropdown';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  isMobile?: boolean;
  style?: React.CSSProperties;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  iconClassName?: string;
}

const SearchBar: React.FC<SearchBarProps> = memo(({ 
  placeholder = "Digite aqui o que você busca",
  className = "",
  isMobile = false,
  style,
  iconClassName
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Hook de busca
  const { 
    searchResults, 
    isSearching, 
    isEmpty
  } = useProductSearch(query);
  
  // Fechar dropdown quando clicar fora
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false)
      setSelectedIndex(-1)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  // Controlar visibilidade do dropdown
  useEffect(() => {
    const shouldShowDropdown = query.length >= 3 && (searchResults.length > 0 || isSearching || isEmpty)
    setIsDropdownOpen(shouldShowDropdown)
  }, [query, searchResults, isSearching, isEmpty])

  // Reset do índice selecionado quando resultados mudam
  useEffect(() => {
    setSelectedIndex(-1)
  }, [searchResults])
  
  // Busca geral quando não há resultados específicos
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      navigate(`/categorias?q=${encodeURIComponent(query.trim())}`);
      setIsDropdownOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }
  }, [query, navigate]);
  
  // Clique em resultado específico
  const handleResultClick = useCallback((result: SearchResult) => {
    navigate(`/produto/${result.slug || result.id}`);
    setIsDropdownOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  }, [navigate]);
  
  // Navegação por teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isDropdownOpen || searchResults.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        handleSearch();
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          const selectedResult = searchResults[selectedIndex];
          handleResultClick(selectedResult);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isDropdownOpen, searchResults, selectedIndex, query, handleResultClick, handleSearch]);
  
  // Mudança no input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    // Abrir dropdown se há texto suficiente
    if (value.length >= 3) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  }, []);
  
  // Foco no input
  const handleInputFocus = () => {
    if (query.length >= 3) {
      setIsDropdownOpen(true);
    }
  };
  
  
  
  return (
    <div ref={containerRef} className="relative w-full z-[1001]">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={className || `w-full px-3 py-2 lg:px-4 lg:py-3 pr-10 lg:pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm lg:text-base transition-all duration-300 ${
            isMobile ? 'min-h-[48px]' : ''
          }`}
          style={style}
          autoComplete="off"
          aria-label="Buscar produtos"
          role="combobox"
          aria-haspopup="listbox"
          aria-controls="search-dropdown"
          aria-expanded={isDropdownOpen}
          aria-autocomplete="list"
          aria-activedescendant={
            selectedIndex >= 0 && searchResults[selectedIndex]
              ? `search-option-${searchResults[selectedIndex].id}`
              : undefined
          }
          aria-busy={isSearching}
        />
        {isSearching && (
          <div className={`absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 ${isMobile ? 'min-h-[48px] min-w-[48px] flex items-center justify-center' : ''}`} aria-hidden>
            <Loader2 className={iconClassName || 'h-4 w-4 lg:h-5 lg:w-5 animate-spin text-primary'} />
          </div>
        )}
      
      <SearchDropdown
        results={searchResults}
        isSearching={isSearching}
        isEmpty={isEmpty}
        showResults={isDropdownOpen}
        query={query}
        selectedIndex={selectedIndex}
        onResultClick={handleResultClick}
        onClose={() => setIsDropdownOpen(false)}
      />
    </div>
  );
});

export default SearchBar;
