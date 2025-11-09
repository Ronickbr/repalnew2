import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, ChevronRight, ChevronDown, Folder, FolderOpen, Package, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Category } from '../../lib/supabase';

interface CategoryFormData {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  is_parent: boolean;
  sort_order: number;
}

interface CategoryManagerProps {
  onCategorySelect?: (category: Category) => void;
  selectedCategory?: Category | null;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  onCategorySelect,
  selectedCategory 
}: CategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryFormData | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    is_parent: false,
    sort_order: 1
  });

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Handle form input changes
  const handleInputChange = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug when name changes
    if (field === 'name' && !editingCategory?.id) {
      setFormData(prev => ({ 
        ...prev, 
        slug: generateSlug(value as string)
      }));
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setFormLoading(true);
      
      if (editingCategory?.id) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id);
        
        if (error) throw error;
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert(formData);
        
        if (error) throw error;
      }
      
      // Reset form and refresh data
      setShowForm(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        parent_id: '',
        is_parent: false,
        sort_order: 1
      });
      
      await fetchCategories();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      alert('Erro ao salvar categoria. Tente novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  // Edit category
  const handleEdit = (category: Category) => {
    setEditingCategory({
      id: category.id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent_id?.toString() || '',
      is_parent: category.is_parent || false,
      sort_order: category.sort_order || 1
    });
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent_id?.toString() || '',
      is_parent: category.is_parent || false,
      sort_order: category.sort_order || 1
    });
    setShowForm(true);
  };

  // Delete category
  const handleDelete = async (categoryId: string | number) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
      await fetchCategories();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      alert('Erro ao excluir categoria. Tente novamente.');
    }
  };

  // Toggle category expansion
  const toggleExpansion = (categoryId: string | number) => {
    const newExpanded = new Set(expandedCategories);
    const idStr = categoryId.toString();
    if (newExpanded.has(idStr)) {
      newExpanded.delete(idStr);
    } else {
      newExpanded.add(idStr);
    }
    setExpandedCategories(newExpanded);
  };

  // Filter categories based on search term
  const filterCategories = (categories: Category[]): Category[] => {
    if (!searchTerm) return categories;
    
    const term = searchTerm.toLowerCase();
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(term) ||
      cat.description?.toLowerCase().includes(term) ||
      cat.slug.toLowerCase().includes(term)
    );
  };

  // Group categories by parent/child relationship
  const groupCategories = (categories: Category[]) => {
    const parentCategories = categories.filter(cat => !cat.parent_id);
    const childCategories = categories.filter(cat => cat.parent_id);
    
    return parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(child => child.parent_id === parent.id)
    }));
  };

  // Get filtered and grouped categories
  const processedCategories = groupCategories(filterCategories(categories));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Categorias</h2>
          <p className="text-gray-600">Organize suas categorias e subcategorias</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCategory(null);
            setFormData({
              name: '',
              slug: '',
              description: '',
              parent_id: '',
              is_parent: false,
              sort_order: 1
            });
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar categorias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category Tree */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Estrutura de Categorias</h3>
        </div>
        
        <div className="p-4 space-y-2">
          {processedCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma categoria encontrada</p>
            </div>
          ) : (
            processedCategories.map((category) => (
              <div key={category.id} className="space-y-2">
                {/* Parent Category */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleExpansion(category.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedCategories.has(category.id.toString()) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    {expandedCategories.has(category.id.toString()) ? (
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Folder className="w-5 h-5 text-gray-600" />
                    )}
                    <button
                      onClick={() => handleCategorySelect(category)}
                      className={`text-left flex-1 ${selectedCategory?.id === category.id ? 'bg-blue-50 p-2 rounded' : ''}`}
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {category.children?.length || 0} subcategorias
                    </span>
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1 text-gray-500 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-1 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Child Categories */}
                {expandedCategories.has(category.id.toString()) && category.children && category.children.length > 0 && (
                  <div className="ml-8 space-y-2">
                    {category.children.map((child) => (
                      <div key={child.id} className={`flex items-center justify-between p-3 bg-white border rounded-lg ${selectedCategory?.id === child.id ? 'ring-2 ring-blue-500' : ''}`}>
                        <div className="flex items-center space-x-3">
                          <Package className="w-4 h-4 text-gray-400" />
                          <button
                            onClick={() => handleCategorySelect(child)}
                            className="text-left flex-1"
                          >
                            <div>
                              <h5 className="font-medium text-gray-900">{child.name}</h5>
                              <p className="text-sm text-gray-600">{child.description}</p>
                            </div>
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(child)}
                            className="p-1 text-gray-500 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(child.id)}
                            className="p-1 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria Pai
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => handleInputChange('parent_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sem categoria pai (Categoria Principal)</option>
                    {categories
                      .filter(cat => !cat.parent_id && cat.id.toString() !== editingCategory?.id?.toString())
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_parent"
                    checked={formData.is_parent}
                    onChange={(e) => handleInputChange('is_parent', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="is_parent" className="text-sm font-medium text-gray-700">
                    Esta categoria pode ter subcategorias
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCategory(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {formLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingCategory ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;