import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { SearchResult } from '../hooks/useProductSearch';

interface SearchDropdownProps {
  results: SearchResult[];
  isSearching: boolean;
  isEmpty: boolean;
  showResults: boolean;
  query: string;
  selectedIndex: number;
  onResultClick: (result: SearchResult) => void;
  onClose: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  results,
  isSearching,
  isEmpty,
  showResults,
  query,
  selectedIndex,
  onResultClick,
  onClose
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLAnchorElement>(null);

  // Scroll para o item selecionado
  useEffect(() => {
    if (selectedItemRef.current && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const selectedItem = selectedItemRef.current;
      const dropdownRect = dropdown.getBoundingClientRect();
      const itemRect = selectedItem.getBoundingClientRect();
      
      if (itemRect.bottom > dropdownRect.bottom) {
        selectedItem.scrollIntoView({ block: 'end', behavior: 'smooth' });
      } else if (itemRect.top < dropdownRect.top) {
        selectedItem.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!showResults) {
    return null;
  }

  return (
    <div 
      ref={dropdownRef}
      id="search-dropdown"
      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[1002] max-h-96 overflow-y-auto"
      style={{ minWidth: '300px' }}
      role="listbox"
      aria-label="Resultados da busca"
      aria-live="polite"
    >
      {isSearching ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-red-600 mr-2" />
          <span className="text-sm text-gray-600">Buscando produtos...</span>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <Search className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 text-center">
            Nenhum produto encontrado para "{query}"
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            Tente usar termos diferentes
          </p>
        </div>
      ) : (
        <div className="py-2">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500">
              {results.length} produto{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {results.map((result, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Link
                key={result.id}
                id={`search-option-${result.id}`}
                ref={isSelected ? selectedItemRef : null}
                to={`/produto/${result.slug || result.id}`}
                onClick={() => {
                  onResultClick(result);
                  onClose();
                }}
                className={`flex items-center space-x-3 px-3 py-3 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0 ${
                  isSelected ? 'bg-red-50 border-red-100' : ''
                }`}
                role="option"
                aria-selected={isSelected}
              >
                {/* Imagem do produto */}
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                  {result.product_images && result.product_images.length > 0 ? (
                    <img 
                      src={
                        result.product_images?.[0]?.image_url || 
                        result.image_url || 
                        '/placeholder-product.jpg'
                      }
                      alt={result.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-product.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Nome do produto */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    isSelected ? 'text-red-700' : 'text-gray-900'
                  }`}>
                    {result.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Ver detalhes
                  </p>
                </div>
                
                {/* Indicador de seleção */}
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  </div>
                )}
              </Link>
            );
          })}
          
          {results.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Use as setas ↑↓ para navegar e Enter para selecionar
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
