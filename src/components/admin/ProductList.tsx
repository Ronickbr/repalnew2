import React from 'react';
import { Plus, Search, Package, X, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, Category } from '../../lib/supabase';

interface ProductListProps {
  products: Product[];
  parentCategories: Category[];
  filteredSubcategories: Category[];
  searchTerm: string;
  selectedCategory: string;
  selectedSubcategory: string;
  currentPage: number;
  itemsPerPage: number;
  paginatedProducts: Product[];
  filteredProducts: Product[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onPageChange: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: (totalPages: number) => void;
  getCategoryName: (categoryId: string) => string;
  getSubcategoryName: (subcategoryId: string) => string;
  getTotalPages: (totalItems: number) => number;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  parentCategories,
  filteredSubcategories,
  searchTerm,
  selectedCategory,
  selectedSubcategory,
  currentPage,
  itemsPerPage,
  paginatedProducts,
  filteredProducts,
  onSearchChange,
  onCategoryChange,
  onSubcategoryChange,
  onNewProduct,
  onEditProduct,
  onViewProduct,
  onDeleteProduct,
  onPageChange,
  onPreviousPage,
  onNextPage,
  getCategoryName,
  getSubcategoryName,
  getTotalPages
}) => {
  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange('');
    onSubcategoryChange('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
        <button 
          onClick={onNewProduct}
          className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Produto</span>
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Todas as categorias</option>
            {parentCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={selectedSubcategory}
            onChange={(e) => onSubcategoryChange(e.target.value)}
            disabled={!selectedCategory}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Todas as subcategorias</option>
            {filteredSubcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/6 min-w-[250px]">
                  Produto
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 min-w-[100px]">
                  Categoria
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 min-w-[100px]">
                  Subcategoria
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 min-w-[100px]">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 min-w-[100px]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 w-2/6 min-w-[250px]">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full object-cover" src={product.product_images?.[0]?.image_url || product.image_url || '/placeholder.jpg'} alt={product.name} />
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate" title={product.name}>
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate" title={product.description || 'Sem descrição'}>
                            {product.description ? product.description.substring(0, 50) + '...' : 'Sem descrição'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 w-1/6 min-w-[100px]">
                      <div className="text-sm text-gray-900 truncate" title={getCategoryName(product.category_id?.toString() || '')}>
                        {getCategoryName(product.category_id?.toString() || '')}
                      </div>
                    </td>
                    <td className="px-3 py-4 w-1/6 min-w-[100px]">
                      <div className="text-sm text-gray-900 truncate" title={getSubcategoryName(product.subcategory_id?.toString() || '')}>
                        {getSubcategoryName(product.subcategory_id?.toString() || '')}
                      </div>
                    </td>
                    <td className="px-3 py-4 w-1/6 min-w-[100px]">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                          product.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.active ? 'Ativo' : 'Inativo'}
                        </span>
                        {product.featured && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 w-fit">
                            Destaque
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 w-1/6 min-w-[100px]">
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => onViewProduct(product)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 flex-shrink-0"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => onEditProduct(product)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 flex-shrink-0"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteProduct(product.id.toString())}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 flex-shrink-0"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      {products.length === 0 ? (
                        <>
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Nenhum produto cadastrado
                            </h3>
                            <p className="text-gray-500 mb-4">
                              Comece adicionando seu primeiro produto para começar a gerenciar seu catálogo.
                            </p>
                            <button
                              onClick={onNewProduct}
                              className="bg-red-900 hover:bg-red-800 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 mx-auto"
                            >
                              <Plus className="h-5 w-5" />
                              <span>Adicionar Primeiro Produto</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Search className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Nenhum produto encontrado
                            </h3>
                            <p className="text-gray-500 mb-4">
                              Não encontramos produtos que correspondam aos filtros aplicados. Tente ajustar os critérios de busca.
                            </p>
                            <button
                              onClick={clearFilters}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 mx-auto"
                            >
                              <X className="h-5 w-5" />
                              <span>Limpar Filtros</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination for Products */}
        {filteredProducts.length > itemsPerPage && (
          <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length} produtos
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onPreviousPage}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: getTotalPages(filteredProducts.length) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => onNextPage(getTotalPages(filteredProducts.length))}
                disabled={currentPage === getTotalPages(filteredProducts.length)}
                className="p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;