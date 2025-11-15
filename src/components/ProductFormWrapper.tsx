import React from 'react';
import { X } from 'lucide-react';
import ProductForm, { ProductFormData } from './ProductForm';

interface ProductFormWrapperProps {
  showProductModal: boolean;
  productForm: ProductFormData;
  setProductForm: (data: ProductFormData) => void;
  categories: Array<{ id: string | number; name: string; parent_id?: string | number }>;
  subcategories: Array<{ id: string | number; name: string; parent_id?: string | number }>;
  onCategoryChange: (categoryId: string) => void;
  onSaveProduct: () => void;
  onCloseModal: () => void;
  onAiGenerate: (data: ProductFormData) => void;
  aiLoading: boolean;
  aiError: string | null;
  loading: boolean;
  isEditing: boolean;
}

const ProductFormWrapper: React.FC<ProductFormWrapperProps> = ({
  showProductModal,
  productForm,
  setProductForm,
  categories,
  subcategories,
  onCategoryChange,
  onSaveProduct,
  onCloseModal,
  onAiGenerate,
  aiLoading,
  aiError,
  loading,
  isEditing
}) => {
  if (!showProductModal) return null;

  const handleSubmit = (data: ProductFormData) => {
    // Atualizar o formulário principal antes de salvar
    setProductForm(data);
    // Chamar a função de salvamento
    onSaveProduct();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <button
              onClick={onCloseModal}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <ProductForm
            initialData={productForm}
            categories={categories}
            subcategories={subcategories}
            onSubmit={handleSubmit}
            onCancel={onCloseModal}
            onCategoryChange={onCategoryChange}
            onAiGenerate={(data) => {
              // Sincronizar o estado do Admin com os dados atuais do formulário
              setProductForm(data);
              // Disparar a geração de IA com os dados atualizados
              onAiGenerate(data);
            }}
            aiLoading={aiLoading}
            aiError={aiError}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductFormWrapper;