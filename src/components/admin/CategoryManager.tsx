import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Download, 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  Package, 
  Save, 
  X,
  Eye,
  CheckCircle,
  MoreVertical
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { table } from '../../lib/schema';
import type { Category } from '../../lib/supabase';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useAccessibility } from '../../hooks/useAccessibility';
import { LoadingSpinner, LoadingButton, LoadingOverlay } from './LoadingSpinner';
import { NotificationContainer } from './Notification';
import { useNotifications } from '../../hooks/useNotifications';
import SubcategoryForm from './SubcategoryForm';

interface CategoryFormData {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  is_parent: boolean;
  sort_order: number;
  active?: boolean;
}

interface CategoryManagerProps {
  onCategorySelect?: (category: Category) => void;
  selectedCategory?: Category | null;
}

// Validações
const validateCategoryForm = (data: CategoryFormData, categoryType: 'parent' | 'subcategory'): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Validação do nome
  if (!data.name.trim()) {
    errors.name = categoryType === 'parent' ? 'Nome da categoria é obrigatório' : 'Nome da subcategoria é obrigatório';
  } else if (data.name.length < 3) {
    errors.name = 'Nome deve ter pelo menos 3 caracteres';
  } else if (data.name.length > 100) {
    errors.name = 'Nome não pode ter mais de 100 caracteres';
  }
  
  // Validação do slug
  if (!data.slug.trim()) {
    errors.slug = 'Slug é obrigatório';
  } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens';
  } else if (data.slug.length < 3) {
    errors.slug = 'Slug deve ter pelo menos 3 caracteres';
  }
  
  // Validação da descrição
  if (data.description && data.description.length > 500) {
    errors.description = 'Descrição não pode ter mais de 500 caracteres';
  }
  
  // Validação da ordem
  if (data.sort_order < 1 || data.sort_order > 999) {
    errors.sort_order = 'Ordem deve estar entre 1 e 999';
  }
  
  // Validação específica para subcategorias
  if (categoryType === 'subcategory' && !data.parent_id) {
    errors.parent_id = 'Selecione uma categoria pai para a subcategoria';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  onCategorySelect,
  selectedCategory 
}: CategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'sort_order' | 'created_at'>('sort_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryFormData | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);

  // Hooks de erro e acessibilidade
  const { error, handleError, handleAsync, clearError } = useErrorHandler({
    fallbackMessage: 'Erro ao processar categorias. Por favor, tente novamente.'
  });
  const { announceToScreenReader } = useAccessibility();
  const { isLoading: isGlobalLoading, startLoading, stopLoading } = useLoadingState();
  const { notifications, addNotification, removeNotification } = useNotifications();

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    is_parent: false,
    sort_order: 1,
    active: true
  });
  const [categoryType, setCategoryType] = useState<'parent' | 'subcategory'>('parent');
  const [selectedParentForSubcategory, setSelectedParentForSubcategory] = useState<Category | null>(null);

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      startLoading('Carregando categorias...');
      setLoading(true);
      clearError();
      
      const result = await handleAsync(
        supabase
          .from(table('categories'))
          .select('*')
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        'buscar categorias'
      );

      if (result) {
        const allCategories = (result as any).data || [];
        setCategories(allCategories);
        
        // Filtrar apenas as categorias principais (sem parent_id) para contagem
        const parentCategories = allCategories.filter((cat: Category) => !cat.parent_id);
        announceToScreenReader(`${parentCategories.length} categorias carregadas com sucesso`);
      }
    } catch (error) {
      handleError(error, 'Erro ao carregar categorias');
      addNotification('error', 'Erro ao carregar categorias', 'Não foi possível carregar as categorias. Por favor, tente novamente.');
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAllSubcategories();
  }, []);

  // Notification system
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    addNotification(type, message, type === 'error' ? 'Erro na operação' : undefined);
  };

  // Fetch all subcategories
  const fetchAllSubcategories = async () => {
    try {
      const result = await handleAsync(
        supabase
          .from(table('categories'))
          .select('*')
          .not('parent_id', 'is', null)
          .order('name', { ascending: true }),
        'buscar todas as subcategorias'
      );

      if (result) {
        const subcategoriesData = (result as any).data || [];
        setSubcategories(subcategoriesData);
      }
    } catch (error) {
      handleError(error, 'Erro ao carregar subcategorias');
    }
  };

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
    clearError();
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Auto-generate slug when name changes
    if (field === 'name' && !editingCategory?.id) {
      setFormData(prev => ({ 
        ...prev, 
        slug: generateSlug(value as string)
      }));
    }
  };

  // Handle category type change
  const handleCategoryTypeChange = (type: 'parent' | 'subcategory') => {
    setCategoryType(type);
    if (type === 'parent') {
      setSelectedParentForSubcategory(null);
      setFormData(prev => ({ ...prev, parent_id: '' }));
    }
  };

  // Handle parent category selection for subcategory
  const handleParentCategorySelect = (category: Category) => {
    setSelectedParentForSubcategory(category);
    setFormData(prev => ({ ...prev, parent_id: category.id.toString() }));
  };

  // Validate and submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateCategoryForm(formData, categoryType);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      announceToScreenReader('Formulário contém erros. Por favor, corrija os campos indicados.');
      return;
    }
    
    try {
      setFormLoading(true);
      startLoading(editingCategory 
        ? 'Atualizando categoria...' 
        : categoryType === 'subcategory' 
          ? 'Criando subcategoria...' 
          : 'Criando categoria...'
      );
      
      // Check if slug already exists (for new categories or when updating slug)
      if (!editingCategory?.id || formData.slug !== editingCategory.slug) {
        const { data: existingCategory } = await supabase
          .from(table('categories'))
          .select('id')
          .eq('slug', formData.slug)
          .maybeSingle();
        
        if (existingCategory) {
          setFormErrors({ slug: 'Este slug já está em uso' });
          announceToScreenReader('Erro: Este slug já está em uso');
          return;
        }
      }
      
      if (editingCategory?.id) {
        // Update existing category
        const payload = {
          name: formData.name,
          slug: formData.slug,
          sort_order: formData.sort_order,
          active: formData.active ?? true,
        };
        const result = await handleAsync(
          supabase
            .from(table('categories'))
            .update(payload)
            .eq('id', editingCategory.id),
          'atualizar categoria'
        );
        
        if (result) {

          
          showNotification('Categoria atualizada com sucesso', 'success');
          announceToScreenReader(`Categoria ${formData.name} atualizada com sucesso`);
        }
      } else {
        // Create new category
        const payload = {
          name: formData.name,
          slug: formData.slug,
          sort_order: formData.sort_order,
          active: formData.active ?? true,
        };
        const result = await handleAsync(
          supabase
            .from(table('categories'))
            .insert(payload),
          'criar categoria'
        );
        
        if (result) {
          const successMessage = categoryType === 'subcategory' 
            ? 'Subcategoria criada com sucesso' 
            : 'Categoria criada com sucesso';
          showNotification(successMessage, 'success');
          announceToScreenReader(`${categoryType === 'subcategory' ? 'Subcategoria' : 'Categoria'} ${formData.name} criada com sucesso`);
        }
      }
      
      // Reset form and refresh data
      if (!error) {
        closeForm();
        await fetchCategories();
      }
      
    } catch (error) {
      handleError(error, 'Erro ao salvar categoria');
      showNotification('Erro ao salvar categoria. Tente novamente.', 'error');
    } finally {
      setFormLoading(false);
      stopLoading();
    }
  };

  // Close form and reset state
  const closeForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setCategoryType('parent');
    setSelectedParentForSubcategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      parent_id: '',
      is_parent: false,
      sort_order: 1,
      active: true
    });
    setFormErrors({});
    clearError();
  };

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  // Create subcategory - agora usando ID ao invés de slug
  const handleCreateSubcategory = (parentCategory: Category) => {
    setSelectedParentCategory(parentCategory);
    setShowSubcategoryForm(true);
  };

  // Edit category
  const handleEdit = (category: Category) => {
    const isSubcategory = !!category.parent_id;
    setCategoryType(isSubcategory ? 'subcategory' : 'parent');
    
    if (isSubcategory) {
      const parentCat = categories.find(cat => cat.id === category.parent_id);
      setSelectedParentForSubcategory(parentCat || null);
    }
    
    setEditingCategory({
      id: category.id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent_id?.toString() || '',
      is_parent: category.is_parent || false,
      sort_order: category.sort_order || 1,
      active: category.active ?? true
    });
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent_id?.toString() || '',
      is_parent: category.is_parent || false,
      sort_order: category.sort_order || 1,
      active: category.active ?? true
    });
    setShowForm(true);
  };

  // Delete category with confirmation
  const handleDelete = async (categoryId: string | number) => {
    // Check if category has subcategories usando parent_id da tabela categories
    const hasSubcategories = subcategories.some(sub => sub.parent_id === categoryId);
    
    if (hasSubcategories) {
      showNotification('Esta categoria tem subcategorias. Exclua-as primeiro.', 'error');
      announceToScreenReader('Erro: Esta categoria tem subcategorias. Exclua-as primeiro.');
      return;
    }
    
    const confirmed = await showConfirmDialog(
      'Tem certeza que deseja excluir esta categoria?',
      'Esta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;
    
    try {
      startLoading('Excluindo categoria...');
      
      const result = await handleAsync(
        supabase
          .from(table('categories'))
          .delete()
          .eq('id', categoryId),
        'excluir categoria'
      );
      
      if (result) {
        showNotification('Categoria excluída com sucesso', 'success');
        announceToScreenReader('Categoria excluída com sucesso');
        await fetchCategories();
      }
    } catch (error) {
      handleError(error, 'Erro ao excluir categoria');
      showNotification('Erro ao excluir categoria. Tente novamente.', 'error');
    } finally {
      stopLoading();
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedCategories.size === 0) return;
    
    const confirmed = await showConfirmDialog(
      `Tem certeza que deseja excluir ${selectedCategories.size} categorias?`,
      'Esta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;
    
    try {
      startLoading(`Excluindo ${selectedCategories.size} categorias...`);
      
      const result = await handleAsync(
        supabase
          .from(table('categories'))
          .delete()
          .in('id', Array.from(selectedCategories)),
        'excluir categorias em massa'
      );
      
      if (result) {
        showNotification(`${selectedCategories.size} categorias excluídas com sucesso`, 'success');
        announceToScreenReader(`${selectedCategories.size} categorias excluídas com sucesso`);
        setSelectedCategories(new Set());
        await fetchCategories();
      }
    } catch (error) {
      handleError(error, 'Erro ao excluir categorias em massa');
      showNotification('Erro ao excluir categorias. Tente novamente.', 'error');
    } finally {
      stopLoading();
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

  // Toggle all categories expansion
  const toggleAllExpansion = () => {
    const parentCategories = processedCategories.filter(cat => cat.children && cat.children.length > 0);
    if (expandedCategories.size === parentCategories.length) {
      // Todas estão expandidas, recolher todas
      setExpandedCategories(new Set());
    } else {
      // Expandir todas que têm subcategorias
      const allWithChildren = new Set(parentCategories.map(cat => cat.id.toString()));
      setExpandedCategories(allWithChildren);
    }
  };

  // Toggle category selection for bulk operations
  const toggleCategorySelection = (categoryId: string | number) => {
    const newSelected = new Set(selectedCategories);
    const idStr = categoryId.toString();
    
    if (newSelected.has(idStr)) {
      newSelected.delete(idStr);
    } else {
      newSelected.add(idStr);
    }
    
    setSelectedCategories(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  // Filter, sort and group categories
  const processCategories = (categories: Category[]) => {
    // Filtrar apenas categorias principais (sem parent_id)
    let filtered = categories.filter(cat => !cat.parent_id);
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(cat => 
        filterStatus === 'active' ? (cat.active ?? true) : !(cat.active ?? true)
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(term) ||
        cat.description?.toLowerCase().includes(term) ||
        cat.slug.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'sort_order':
          aValue = a.sort_order || 999;
          bValue = b.sort_order || 999;
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    // Group by subcategories from categories table usando parent_id
    const processed = filtered.map(parent => {
      const children = subcategories.filter(sub => sub.parent_id === parent.id);
      return {
        ...parent,
        children: children
      };
    });
    return processed;
  };

  // Export data
  const handleExport = async () => {
    try {
      startLoading('Preparando exportação...');
      
      const processed = processCategories(categories);
      const dataToExport = processed.flatMap(parent => [
        parent,
        ...(parent.children || [])
      ]);
      
      const csvContent = [
        ['ID', 'Nome', 'Slug', 'Descrição', 'Categoria Pai ID', 'Ativa', 'Ordem'],
        ...dataToExport.map(cat => [
          cat.id,
          cat.name,
          cat.slug,
          cat.description || '',
          cat.parent_id || '',
          cat.active ?? true ? 'Sim' : 'Não',
          cat.sort_order || 1
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `categorias_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      showNotification(`Exportação concluída: ${dataToExport.length} registros`, 'success');
      announceToScreenReader(`Exportação concluída: ${dataToExport.length} registros exportados`);
    } catch (error) {
      handleError(error, 'Erro ao exportar categorias');
      showNotification('Erro ao exportar categorias. Tente novamente.', 'error');
    } finally {
      stopLoading();
    }
  };

  // Show confirmation dialog
  const showConfirmDialog = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      resolve(confirmed);
    });
  };

  // Get filtered and grouped categories
  const processedCategories = processCategories(categories);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <LoadingSpinner size="lg" ariaLabel="Carregando categorias" />
        <span className="sr-only">Carregando categorias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Gestão de Categorias">
      <LoadingOverlay isLoading={isGlobalLoading} message={isGlobalLoading ? 'Processando...' : ''} />
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification}
        position="top-right"
      />
      
      {/* Skip Link para navegação rápida */}
      <a 
        href="#category-list" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Ir para lista de categorias
      </a>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestão de Categorias</h1>
            <p className="text-gray-600 text-sm sm:text-base">Organize suas categorias e subcategorias de produtos</p>
            
          </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="Exportar categorias para CSV"
            disabled={isGlobalLoading}
          >
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Exportar
          </button>
          
          <button
            onClick={() => {
              setShowForm(true);
              setEditingCategory(null);
              setCategoryType('parent');
              setSelectedParentForSubcategory(null);
              setFormData({
                name: '',
                slug: '',
                description: '',
                parent_id: '',
                is_parent: false,
                sort_order: 1,
                active: true
              });
              setFormErrors({});
            }}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="Criar nova categoria"
            disabled={isGlobalLoading}
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Nova Categoria
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" role="alert" aria-live="polite">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <span className="text-blue-800 font-medium">
                {selectedCategories.size} categoria(s) selecionada(s)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedCategories(new Set())}
                className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Limpar seleção de categorias"
              >
                Limpar seleção
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors text-sm"
                aria-label={`Excluir ${selectedCategories.size} categorias selecionadas`}
              >
                Excluir selecionadas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filtros e Busca</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <label htmlFor="search-categories" className="sr-only">Buscar categorias</label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden="true" />
            <input
              id="search-categories"
              type="text"
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Buscar categorias por nome, descrição ou slug"
              disabled={isGlobalLoading}
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <label htmlFor="filter-status" className="sr-only">Filtrar por status</label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filtrar categorias por status"
              disabled={isGlobalLoading}
            >
              <option value="all">Todas as categorias</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
            </select>
          </div>
          
          {/* Sort By */}
          <div>
            <label htmlFor="sort-by" className="sr-only">Ordenar por</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'sort_order' | 'created_at')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Ordenar categorias por"
              disabled={isGlobalLoading}
            >
              <option value="sort_order">Ordenar por ordem</option>
              <option value="name">Ordenar por nome</option>
              <option value="created_at">Ordenar por data</option>
            </select>
          </div>
          
          {/* Sort Order */}
          <div>
            <label htmlFor="sort-order" className="sr-only">Ordem de classificação</label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Ordem de classificação"
              disabled={isGlobalLoading}
            >
              <option value="asc">Crescente</option>
              <option value="desc">Decrescente</option>
            </select>
          </div>
        </div>
        
        {/* Results count */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600" role="status" aria-live="polite">
          <span>
            {processedCategories.length} categoria(s) principal(is) encontrada(s)
            {searchTerm && ` para "${searchTerm}"`}
          </span>
          <span>
            {processedCategories.reduce((total, cat) => total + (cat.children?.length || 0), 0)} subcategorias
          </span>
        </div>
      </div>

      {/* Category Tree */}
      <div id="category-list" className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Estrutura de Categorias</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <button 
                onClick={toggleAllExpansion}
                className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-label={expandedCategories.size === processedCategories.filter(cat => cat.children && cat.children.length > 0).length ? 'Recolher todas as categorias' : 'Expandir todas as categorias'}
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
              </button>
              <span aria-hidden="true">•</span>
              <button 
                onClick={toggleAllExpansion}
                className="hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-1 transition-colors"
                aria-label={expandedCategories.size === processedCategories.filter(cat => cat.children && cat.children.length > 0).length ? 'Recolher todas as categorias' : 'Expandir todas as categorias'}
              >
                {expandedCategories.size === processedCategories.filter(cat => cat.children && cat.children.length > 0).length ? 'Recolher tudo' : 'Expandir tudo'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {processedCategories.length === 0 ? (
            <div className="text-center py-12 text-gray-500" role="status" aria-live="polite">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" aria-hidden="true" />
              <p className="text-lg font-medium mb-2">Nenhuma categoria encontrada</p>
              <p className="text-sm mb-4">Crie sua primeira categoria para começar</p>
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingCategory(null);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-label="Criar primeira categoria"
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Criar Categoria
              </button>
            </div>
          ) : (
            processedCategories.map((category) => (
              <div key={category.id} className="p-4 hover:bg-gray-50 transition-colors">
                {/* Parent Category */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(category.id.toString())}
                      onChange={() => toggleCategorySelection(category.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label={`Selecionar categoria ${category.name}`}
                      disabled={isGlobalLoading}
                    />
                    
                    <button
                      onClick={() => toggleExpansion(category.id)}
                      className={`transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        category.children?.length > 0 
                          ? 'text-gray-500 hover:text-gray-700' 
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                      aria-label={expandedCategories.has(category.id.toString()) ? 'Recolher categoria' : category.children?.length > 0 ? 'Expandir categoria' : 'Sem subcategorias'}
                      aria-expanded={expandedCategories.has(category.id.toString())}
                      disabled={!category.children?.length}
                      style={{display: 'block'}}
                    >
                      {expandedCategories.has(category.id.toString()) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    
                    {expandedCategories.has(category.id.toString()) ? (
                      <FolderOpen className="w-5 h-5 text-blue-600" aria-hidden="true" />
                    ) : (
                      <Folder className="w-5 h-5 text-gray-600" aria-hidden="true" />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleCategorySelect(category)}
                          className={`text-left flex-1 ${selectedCategory?.id === category.id ? 'bg-blue-50 p-2 rounded-lg border border-blue-200' : ''}`}
                          aria-label={`Selecionar categoria ${category.name}`}
                        >
                          <div>
                            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                              <span>{category.name}</span>
                              {!(category.active ?? true) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inativa
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-600">{category.description}</p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span>Slug: {category.slug}</span>
                              <span aria-hidden="true">•</span>
                              <span>Ordem: {category.sort_order || 1}</span>
                              <span aria-hidden="true">•</span>
                              <span className={`${category.children?.length > 0 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                                {category.children?.length || 0} {category.children?.length === 1 ? 'subcategoria' : 'subcategorias'}
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCreateSubcategory(category)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      title="Adicionar subcategoria"
                      aria-label={`Adicionar subcategoria à ${category.name}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Editar categoria"
                      aria-label={`Editar categoria ${category.name}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      title="Excluir categoria"
                      aria-label={`Excluir categoria ${category.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Child Categories */}
                {expandedCategories.has(category.id.toString()) && category.children && category.children.length > 0 && (
                  <div className="ml-12 mt-4 space-y-3">
                    <div className="mb-2 text-sm text-gray-500 font-medium">
                      {category.children.length} {category.children.length === 1 ? 'subcategoria' : 'subcategorias'}
                    </div>
                    {category.children.map((child) => (
                      <div key={child.id} className={`flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg ${selectedCategory?.id === child.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                        <div className="flex items-center space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedCategories.has(child.id.toString())}
                            onChange={() => toggleCategorySelection(child.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            aria-label={`Selecionar subcategoria ${child.name}`}
                            disabled={isGlobalLoading}
                          />
                          
                          <Package className="w-4 h-4 text-gray-400" aria-hidden="true" />
                          
                          <button
                            onClick={() => handleCategorySelect(child)}
                            className="text-left flex-1"
                            aria-label={`Selecionar subcategoria ${child.name}`}
                          >
                            <div>
                              <h5 className="font-medium text-gray-900 flex items-center space-x-2">
                                <span>{child.name}</span>
                                {!(child.active ?? true) && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Inativa
                                  </span>
                                )}
                              </h5>
                              <p className="text-sm text-gray-600">{child.description}</p>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                <span>Slug: {child.slug}</span>
                                <span aria-hidden="true">•</span>
                                <span>Ordem: {child.sort_order || 1}</span>
                              </div>
                            </div>
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(child)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            title="Editar subcategoria"
                            aria-label={`Editar subcategoria ${child.name}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(child.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            title="Excluir subcategoria"
                            aria-label={`Excluir subcategoria ${child.name}`}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="category-form-title">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 id="category-form-title" className="text-lg font-semibold text-gray-900">
                  {editingCategory 
                    ? 'Editar Categoria' 
                    : categoryType === 'subcategory' 
                      ? 'Nova Subcategoria' 
                      : 'Nova Categoria'
                  }
                </h3>
                <button
                  onClick={closeForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  aria-label="Fechar formulário"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
              {/* Category Type Selection */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Tipo de Categoria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleCategoryTypeChange('parent')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      categoryType === 'parent'
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                    disabled={isGlobalLoading}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        categoryType === 'parent' ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {categoryType === 'parent' && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">Categoria Principal</div>
                        <div className="text-sm opacity-75">Categoria de nível superior</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategoryTypeChange('subcategory')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      categoryType === 'subcategory'
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                    disabled={isGlobalLoading}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        categoryType === 'subcategory' ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {categoryType === 'subcategory' && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">Subcategoria</div>
                        <div className="text-sm opacity-75">Subcategoria de uma categoria</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Parent Category Selection for Subcategory */}
              {categoryType === 'subcategory' && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-900 mb-3">
                    Categoria Pai <span className="text-red-500">*</span>
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.filter(cat => !cat.parent_id).map((category) => (
                      <label
                        key={category.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedParentForSubcategory?.id === category.id
                            ? 'bg-blue-100 border border-blue-300'
                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="parentCategory"
                          checked={selectedParentForSubcategory?.id === category.id}
                          onChange={() => handleParentCategorySelect(category)}
                          className="text-blue-600 focus:ring-blue-500"
                          disabled={isGlobalLoading}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{category.name}</div>
                          <div className="text-sm text-gray-500">Slug: {category.slug}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {categories.filter(cat => !cat.parent_id).length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="text-yellow-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-yellow-800 font-medium">Nenhuma categoria principal disponível</p>
                          <p className="text-sm text-yellow-700">Você precisa criar uma categoria principal antes de adicionar subcategorias.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {formErrors.parent_id && (
                    <p id="parent-error" className="mt-2 text-sm text-red-600" role="alert">{formErrors.parent_id}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-2">
                    {categoryType === 'parent' ? 'Nome da Categoria *' : 'Nome da Subcategoria *'}
                  </label>
                  <input
                    id="category-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={categoryType === 'parent' ? 'Ex: Cozinha Industrial' : 'Ex: Fogões Industriais'}
                    required
                    aria-invalid={!!formErrors.name}
                    aria-describedby={formErrors.name ? 'name-error' : undefined}
                    disabled={isGlobalLoading}
                  />
                  {formErrors.name && (
                    <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">{formErrors.name}</p>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <label htmlFor="category-slug" className="block text-sm font-medium text-gray-700 mb-2">
                    Slug *
                  </label>
                  <input
                    id="category-slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.slug ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={categoryType === 'parent' ? 'ex-cozinha-industrial' : 'ex-fogoes-industriais'}
                    required
                    aria-invalid={!!formErrors.slug}
                    aria-describedby={formErrors.slug ? 'slug-error' : 'slug-help'}
                    disabled={isGlobalLoading}
                  />
                  {formErrors.slug && (
                    <p id="slug-error" className="mt-1 text-sm text-red-600" role="alert">{formErrors.slug}</p>
                  )}
                  <p id="slug-help" className="mt-1 text-xs text-gray-500">
                    URL amigável {categoryType === 'parent' ? 'para a categoria' : 'para a subcategoria'} (apenas letras minúsculas, números e hífens)
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="category-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  id="category-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  rows={3}
                  placeholder="Descreva esta categoria..."
                  aria-invalid={!!formErrors.description}
                  aria-describedby={formErrors.description ? 'description-error' : 'description-help'}
                  disabled={isGlobalLoading}
                />
                {formErrors.description && (
                  <p id="description-error" className="mt-1 text-sm text-red-600" role="alert">{formErrors.description}</p>
                )}
                <p id="description-help" className="mt-1 text-xs text-gray-500">
                  Máximo de 500 caracteres
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sort Order */}
                <div>
                  <label htmlFor="category-order" className="block text-sm font-medium text-gray-700 mb-2">
                    Ordem de Exibição
                  </label>
                  <input
                    id="category-order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.sort_order ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="1"
                    max="999"
                    aria-invalid={!!formErrors.sort_order}
                    aria-describedby={formErrors.sort_order ? 'order-error' : undefined}
                    disabled={isGlobalLoading}
                  />
                  {formErrors.sort_order && (
                    <p id="order-error" className="mt-1 text-sm text-red-600" role="alert">{formErrors.sort_order}</p>
                  )}
                </div>

                {/* Active Status */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => handleInputChange('active', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label="Categoria ativa"
                      disabled={isGlobalLoading}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Categoria Ativa
                      </span>
                      <p className="text-xs text-gray-500">
                        Ative para que a categoria fique visível no site
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeForm}
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
                  loadingText={editingCategory ? 'Atualizando...' : categoryType === 'subcategory' ? 'Criando Subcategoria...' : 'Criando Categoria...'}
                  aria-label={editingCategory ? 'Atualizar categoria' : categoryType === 'subcategory' ? 'Criar subcategoria' : 'Criar categoria'}
                >
                  <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                  {editingCategory ? 'Atualizar Categoria' : categoryType === 'subcategory' ? 'Criar Subcategoria' : 'Criar Categoria'}
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategory Form Modal */}
      <SubcategoryForm 
        isOpen={showSubcategoryForm}
        onClose={() => setShowSubcategoryForm(false)}
        parentCategory={selectedParentCategory}
        onSuccess={() => {
          setShowSubcategoryForm(false);
          setSelectedParentCategory(null);
          fetchCategories(); // Recarregar categorias
          fetchAllSubcategories(); // Recarregar subcategorias
        }}
      />
    </div>
  );
};

export default CategoryManager;
