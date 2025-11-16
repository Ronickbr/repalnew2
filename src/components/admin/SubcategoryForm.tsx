import React, { useState } from 'react';
import { X, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { table } from '../../lib/schema';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useNotifications } from '../../hooks/useNotifications';
import { LoadingButton, LoadingOverlay } from './LoadingSpinner';
import { NotificationContainer } from './Notification';
import type { Category } from '../../lib/supabase';

interface SubcategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  parentCategory: Category | null;
  onSuccess: () => void;
}

interface SubcategoryFormData {
  name: string;
  slug: string;
  is_active: boolean;
}

const validateSubcategoryForm = (data: SubcategoryFormData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  if (!data.name.trim()) {
    errors.name = 'Nome da subcategoria é obrigatório';
  } else if (data.name.length < 2) {
    errors.name = 'Nome deve ter pelo menos 2 caracteres';
  } else if (data.name.length > 100) {
    errors.name = 'Nome não pode ter mais de 100 caracteres';
  }
  
  if (!data.slug.trim()) {
    errors.slug = 'Slug é obrigatório';
  } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens';
  } else if (data.slug.length < 2) {
    errors.slug = 'Slug deve ter pelo menos 2 caracteres';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const SubcategoryForm: React.FC<SubcategoryFormProps> = ({ 
  isOpen, 
  onClose, 
  parentCategory, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState<SubcategoryFormData>({
    name: '',
    slug: '',
    is_active: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  const { handleError, handleAsync, clearError } = useErrorHandler({
    fallbackMessage: 'Erro ao processar subcategoria. Por favor, tente novamente.'
  });
  const { announceToScreenReader } = useAccessibility();
  const { isLoading: isGlobalLoading, startLoading, stopLoading } = useLoadingState();
  const { notifications, addNotification, removeNotification } = useNotifications();

  if (!isOpen || !parentCategory) return null;

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (field: keyof SubcategoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError();
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    if (field === 'name' && !formData.slug) {
      setFormData(prev => ({ 
        ...prev, 
        slug: generateSlug(value as string)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateSubcategoryForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      announceToScreenReader('Formulário contém erros. Por favor, corrija os campos indicados.');
      return;
    }
    
    try {
      setFormLoading(true);
      startLoading('Criando subcategoria...');
      
      // Check if slug already exists in the same parent category
      const { data: existingSubcategory } = await supabase
        .from(table('categories'))
        .select('id')
        .eq('slug', formData.slug)
        .eq('parent_id', parentCategory.id)
        .maybeSingle();
      
      if (existingSubcategory) {
        setFormErrors({ slug: 'Este slug já está em uso nesta categoria' });
        announceToScreenReader('Erro: Este slug já está em uso nesta categoria');
        return;
      }
      
      const payload = {
        name: formData.name,
        slug: formData.slug,
        parent_id: parentCategory.id,
        active: formData.is_active,
        sort_order: 1
      };
      
      const result = await handleAsync(
        supabase
          .from(table('categories'))
          .insert(payload),
        'criar subcategoria'
      );
      
      if (result) {
        addNotification('success', 'Subcategoria criada com sucesso');
        announceToScreenReader(`Subcategoria ${formData.name} criada com sucesso`);
        onSuccess();
      }
      
    } catch (error) {
      handleError(error, 'Erro ao criar subcategoria');
      addNotification('error', 'Erro ao criar subcategoria. Tente novamente.');
    } finally {
      setFormLoading(false);
      stopLoading();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="subcategory-form-title">
      <LoadingOverlay isLoading={isGlobalLoading} message={isGlobalLoading ? 'Processando...' : ''} />
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification}
        position="top-right"
      />
      
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 id="subcategory-form-title" className="text-lg font-semibold text-gray-900">
                Nova Subcategoria
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Adicionar subcategoria à categoria: <span className="font-medium">{parentCategory.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              aria-label="Fechar formulário"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="subcategory-name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Subcategoria *
              </label>
              <input
                id="subcategory-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: Fogões Industriais"
                required
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? 'subcategory-name-error' : undefined}
                disabled={isGlobalLoading}
              />
              {formErrors.name && (
                <p id="subcategory-name-error" className="mt-1 text-sm text-red-600" role="alert">{formErrors.name}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="subcategory-slug" className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                id="subcategory-slug"
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.slug ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="ex-fogoes-industriais"
                required
                aria-invalid={!!formErrors.slug}
                aria-describedby={formErrors.slug ? 'subcategory-slug-error' : 'subcategory-slug-help'}
                disabled={isGlobalLoading}
              />
              {formErrors.slug && (
                <p id="subcategory-slug-error" className="mt-1 text-sm text-red-600" role="alert">{formErrors.slug}</p>
              )}
              <p id="subcategory-slug-help" className="mt-1 text-xs text-gray-500">
                URL amigável para a subcategoria (apenas letras minúsculas, números e hífens)
              </p>
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label="Subcategoria ativa"
                disabled={isGlobalLoading}
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Subcategoria Ativa
                </span>
                <p className="text-xs text-gray-500">
                  Ative para que a subcategoria fique visível no site
                </p>
              </div>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors font-medium"
              aria-label="Cancelar operação"
              disabled={isGlobalLoading}
            >
              Cancelar
            </button>
            <LoadingButton
              type="submit"
              isLoading={formLoading}
              disabled={isGlobalLoading}
              variant="primary"
              loadingText="Criando..."
              aria-label="Criar subcategoria"
            >
              <Package className="w-4 h-4 mr-2" aria-hidden="true" />
              Criar Subcategoria
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubcategoryForm;