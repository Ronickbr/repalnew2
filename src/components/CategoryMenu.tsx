import React, { memo, useState, useRef, useEffect } from 'react';
import { ChevronDown, Grid3X3 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  subcategories: Array<{
    id: string;
    name: string;
  }>;
}

interface CategoryMenuProps {
  categories: Category[];
  selectedCategory: string;
  selectedSubcategory: string;
  onCategorySelect: (categoryId: string) => void;
  onSubcategorySelect: (subcategoryId: string) => void;
  className?: string;
}

const CategoryMenu: React.FC<CategoryMenuProps> = memo(({
  categories,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  onSubcategorySelect,
  className = ''
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'all') {
      onCategorySelect('all');
      onSubcategorySelect('');
      setOpenDropdown(null);
      return;
    }

    if (openDropdown === categoryId) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(categoryId);
    }
  };

  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    onCategorySelect(categoryId);
    onSubcategorySelect(subcategoryId);
    setOpenDropdown(null);
  };

  const getCategoryDisplayName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || categoryId;
  };

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`} ref={menuRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          {/* Título da seção */}
          <div className="flex items-center gap-2 mb-4">
            <Grid3X3 className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
          </div>

          {/* Menu horizontal de categorias */}
          <div className="flex flex-wrap gap-2 lg:gap-4">
            {/* Todas as categorias */}
            <button
              onClick={() => handleCategoryClick('all')}
              className={`whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                selectedCategory === 'all'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200'
              }`}
            >
              Todas as Categorias
            </button>

            {/* Categorias dinâmicas */}
            {categories.map((category) => (
              <div key={category.id} className="relative">
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  className={`whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5 text-sm sm:text-base ${
                    selectedCategory === category.id
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200'
                  }`}
                >
                  <span>{category.name}</span>
                  {category.subcategories.length > 0 && (
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-200 ${
                        openDropdown === category.id ? 'rotate-180' : ''
                      }`} 
                    />
                  )}
                </button>

                {/* Dropdown de subcategorias */}
                {openDropdown === category.id && category.subcategories.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="py-2">
                      {/* Opção "Todas" da categoria */}
                      <button
                        onClick={() => {
                          onCategorySelect(category.id);
                          onSubcategorySelect('');
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          selectedCategory === category.id && !selectedSubcategory
                            ? 'bg-red-50 text-red-600 font-medium'
                            : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        Todas em {category.name}
                      </button>
                      
                      {/* Divisor */}
                      <div className="border-t border-gray-100 my-1" />
                      
                      {/* Subcategorias */}
                      {category.subcategories.map((subcategory) => (
                        <button
                          key={subcategory.id}
                          onClick={() => handleSubcategoryClick(category.id, subcategory.id)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            selectedCategory === category.id && selectedSubcategory === subcategory.id
                              ? 'bg-red-50 text-red-600 font-medium'
                              : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                          }`}
                        >
                          {subcategory.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Breadcrumb da categoria selecionada */}
          {selectedCategory !== 'all' && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <span>Navegando em:</span>
              <span className="font-medium text-red-600">
                {getCategoryDisplayName(selectedCategory)}
              </span>
              {selectedSubcategory && (
                <>
                  <span>&gt;</span>
                  <span className="font-medium text-red-600">
                    {categories
                      .find(cat => cat.id === selectedCategory)
                      ?.subcategories.find(sub => sub.id === selectedSubcategory)
                      ?.name || selectedSubcategory}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CategoryMenu.displayName = 'CategoryMenu';

export default CategoryMenu;