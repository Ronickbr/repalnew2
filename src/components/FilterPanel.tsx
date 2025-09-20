import React, { memo } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';



interface FilterPanelProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  selectedCategory: string;
  selectedSubcategory: string;
  onSubcategoryChange: (subcategory: string) => void;
  availableSubcategories: Array<{ id: string; name: string }>;
  showFeaturedOnly: boolean;
  onShowFeaturedOnlyChange: (show: boolean) => void;
  showHomepageFeatured: boolean;
  onShowHomepageFeaturedChange: (show: boolean) => void;
  showClearanceSale: boolean;
  onShowClearanceSaleChange: (show: boolean) => void;
  hideDisabled: boolean;
  onHideDisabledChange: (hide: boolean) => void;
  onClearFilters: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  totalResults: number;
  className?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = memo(({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedCategory,
  selectedSubcategory,
  onSubcategoryChange,
  availableSubcategories,
  showFeaturedOnly,
  onShowFeaturedOnlyChange,
  showHomepageFeatured,
  onShowHomepageFeaturedChange,
  showClearanceSale,
  onShowClearanceSaleChange,
  hideDisabled,
  onHideDisabledChange,
  onClearFilters,
  showFilters,
  onToggleFilters,
  totalResults,
  className = ''
}) => {


  const hasActiveFilters = searchTerm || sortBy !== 'name' || selectedSubcategory || showFeaturedOnly || showHomepageFeatured || showClearanceSale || !hideDisabled;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {/* Header do painel - sempre visível */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtros</h3>
            {hasActiveFilters && (
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                Ativo
              </span>
            )}
          </div>
          
          {/* Toggle para mobile */}
          <div className="lg:hidden">
            <button
              onClick={onToggleFilters}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Contador de resultados */}
        <p className="text-sm text-gray-600 mt-2">
          {totalResults} produto{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Conteúdo dos filtros */}
      <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="p-4 space-y-6">
          {/* Busca */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Buscar Produtos
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Digite o nome do produto..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Ordenação */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-sm bg-white"
            >
              <option value="name">Nome A-Z</option>
              <option value="name-desc">Nome Z-A</option>
              <option value="newest">Mais Recentes</option>
              <option value="popular">Mais Populares</option>
            </select>
          </div>

          {/* Subcategorias - Exibir apenas quando uma categoria específica estiver selecionada */}
          {selectedCategory !== 'all' && availableSubcategories.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Subcategorias
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {/* Opção "Todas as subcategorias" */}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="subcategory"
                    value=""
                    checked={selectedSubcategory === ''}
                    onChange={() => onSubcategoryChange('')}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Todas as subcategorias</span>
                </label>
                
                {/* Lista de subcategorias */}
                {availableSubcategories.map((subcategory) => (
                  <label key={subcategory.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="subcategory"
                      value={subcategory.id}
                      checked={selectedSubcategory === subcategory.id}
                      onChange={() => onSubcategoryChange(subcategory.id)}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">{subcategory.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Filtros Especiais */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Filtros Especiais
            </label>
            <div className="space-y-3">
              {/* Ocultar produtos desativados */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideDisabled}
                  onChange={(e) => onHideDisabledChange(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Ocultar produtos desativados</span>
              </label>

              {/* Apenas produtos em destaque no dropdown */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFeaturedOnly}
                  onChange={(e) => onShowFeaturedOnlyChange(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Apenas destaques do dropdown</span>
              </label>

              {/* Apenas produtos destaque da homepage */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHomepageFeatured}
                  onChange={(e) => onShowHomepageFeaturedChange(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Apenas destaques da homepage</span>
              </label>

              {/* Apenas produtos em queima de estoque */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showClearanceSale}
                  onChange={(e) => onShowClearanceSaleChange(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Apenas queima de estoque</span>
              </label>
            </div>
          </div>

          {/* Botão Limpar Filtros */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="w-full px-4 py-2.5 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <X className="w-4 h-4" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

FilterPanel.displayName = 'FilterPanel';

export default FilterPanel;