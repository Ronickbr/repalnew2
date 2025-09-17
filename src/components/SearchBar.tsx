import React, { memo, useState, useRef, useEffect } from 'react';
import { Search, X, Filter, TrendingUp } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterToggle?: () => void;
  showFilterButton?: boolean;
  placeholder?: string;
  suggestions?: string[];
  recentSearches?: string[];
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = memo(({
  value,
  onChange,
  onFilterToggle,
  showFilterButton = false,
  placeholder = "Buscar produtos...",
  suggestions = [],
  recentSearches = [],
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(newValue.length > 0 || recentSearches.length > 0);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowSuggestions(value.length > 0 || recentSearches.length > 0);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Filtrar sugestões baseadas no valor atual
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(value.toLowerCase()) && suggestion !== value
  ).slice(0, 5);

  const displayRecentSearches = recentSearches.filter(search =>
    !value || search.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 3);

  const hasContent = filteredSuggestions.length > 0 || displayRecentSearches.length > 0;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Barra de busca principal */}
      <div className={`relative flex items-center bg-white rounded-xl border-2 transition-all duration-200 ${
        isFocused 
          ? 'border-red-500 shadow-lg shadow-red-500/10' 
          : 'border-gray-200 hover:border-gray-300'
      }`}>
        {/* Ícone de busca */}
        <div className="pl-4 pr-3">
          <Search className={`w-5 h-5 transition-colors ${
            isFocused ? 'text-red-500' : 'text-gray-400'
          }`} />
        </div>

        {/* Input de busca */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 py-3 px-1 text-gray-900 placeholder-gray-500 bg-transparent border-none outline-none text-sm sm:text-base"
        />

        {/* Botão de limpar */}
        {value && (
          <button
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Botão de filtros */}
        {showFilterButton && (
          <button
            onClick={onFilterToggle}
            className="p-2 mr-2 text-gray-400 hover:text-red-500 transition-colors border-l border-gray-200 ml-2"
            aria-label="Abrir filtros"
          >
            <Filter className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown de sugestões */}
      {showSuggestions && hasContent && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="py-2">
            {/* Buscas recentes */}
            {displayRecentSearches.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Buscas Recentes
                </div>
                {displayRecentSearches.map((search, index) => (
                  <button
                    key={`recent-${index}`}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-3"
                  >
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span>{search}</span>
                  </button>
                ))}
                {filteredSuggestions.length > 0 && (
                  <div className="border-t border-gray-100 my-1" />
                )}
              </div>
            )}

            {/* Sugestões */}
            {filteredSuggestions.length > 0 && (
              <div>
                {displayRecentSearches.length > 0 && (
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <Search className="w-3 h-3" />
                    Sugestões
                  </div>
                )}
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={`suggestion-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-3"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span>
                      {suggestion.split(new RegExp(`(${value})`, 'gi')).map((part, i) => (
                        part.toLowerCase() === value.toLowerCase() ? (
                          <mark key={i} className="bg-yellow-200 text-gray-900">{part}</mark>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;