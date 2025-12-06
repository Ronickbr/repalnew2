import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { table } from '../../lib/schema';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download,
  Save,
  X,
  Image as ImageIcon,
  AlertCircle,
  ExternalLink,
  Building,
  Upload,
  Link,
  FileImage
} from 'lucide-react';

import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useAccessibility, useLoadingState } from '../../hooks/useAccessibility';
import { LoadingSpinner, LoadingButton, LoadingOverlay } from './LoadingSpinner';
import { NotificationContainer } from './Notification';
import { useNotifications } from '../../hooks/useNotifications';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface BrandFormData {
  name: string;
  slug: string;
  logo_url: string;
}

interface FilterState {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function BrandManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    slug: '',
    logo_url: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  // Estado para upload de logo
  const [logoMethod, setLogoMethod] = useState<'url' | 'upload'>('url');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks de erro e acessibilidade
  const { error, handleError, handleAsync, clearError } = useErrorHandler({
    fallbackMessage: 'Erro ao processar marcas. Por favor, tente novamente.'
  });
  const { announceToScreenReader } = useAccessibility();
  const { isLoading: isGlobalLoading, startLoading, stopLoading } = useLoadingState();
  const { notifications, addNotification, removeNotification } = useNotifications();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      startLoading('Carregando marcas...');
      setLoading(true);
      clearError();
      
      const result = await handleAsync(
        supabase
          .from(table('brands'))
          .select('*')
          .order('name'),
        'buscar marcas'
      );

      if (result && (result as any).data) {
        setBrands((result as any).data || []);
        announceToScreenReader(`${(result as any).data.length || 0} marcas carregadas com sucesso`);
      }
    } catch (err) {
      handleError(err, 'Erro ao carregar marcas');
      addNotification('error', 'Erro ao carregar marcas', 'Não foi possível carregar as marcas. Por favor, tente novamente.');
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  const filteredBrands = useMemo(() => {
    let filtered = [...brands];

    // Filtro de busca
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(brand => 
        brand.name.toLowerCase().includes(searchTerm) ||
        brand.slug.toLowerCase().includes(searchTerm)
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof Brand];
      let bValue: any = b[filters.sortBy as keyof Brand];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [brands, filters]);

  const validateBrandForm = (data: BrandFormData): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!data.name.trim()) {
      errors.name = 'Nome da marca é obrigatório';
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
    } else if (data.slug.length > 100) {
      errors.slug = 'Slug não pode ter mais de 100 caracteres';
    }

    // Validação do logo depende do método escolhido
    if (
      logoMethod === 'url' &&
      data.logo_url &&
      !(/^https?:\/\/.+/.test(data.logo_url) || data.logo_url.startsWith('data:'))
    ) {
      errors.logo_url = 'URL do logo deve ser válida';
    }

    if (logoMethod === 'upload' && !selectedFile && !data.logo_url) {
      errors.logo_file = 'Por favor, selecione uma imagem para o logo';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateBrandForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      announceToScreenReader('Formulário contém erros. Por favor, corrija os campos indicados.');
      return;
    }

    let finalLogoUrl = formData.logo_url;
    if (logoMethod === 'upload' && selectedFile) {
      const uploadedUrl = await uploadLogoToStorage(selectedFile);
      if (!uploadedUrl) {
        return;
      }
      finalLogoUrl = uploadedUrl;
    } else if (logoMethod === 'url' && formData.logo_url) {
      const processed = await processLogoUrl(formData.logo_url);
      if (!processed) {
        setFormErrors(prev => ({ ...prev, logo_url: 'Não foi possível processar a imagem do logo' }));
        announceToScreenReader('Erro ao processar a imagem do logo');
        return;
      }
      finalLogoUrl = processed;
    }

    try {
      setSubmitting(true);
      startLoading(editingBrand ? 'Atualizando marca...' : 'Criando marca...');
      setFormErrors({});

      const brandData = {
        name: formData.name,
        slug: formData.slug.toLowerCase().trim(),
        logo_url: finalLogoUrl
      };

      if (editingBrand) {
        // Check if slug already exists (for new brands or when updating slug)
        if (!editingBrand.id || formData.slug !== editingBrand.slug) {
          const { data: existingBrand } = await supabase
            .from(table('brands'))
            .select('id')
            .eq('slug', formData.slug)
            .single();
          
          if (existingBrand) {
            setFormErrors({ slug: 'Este slug já está em uso' });
            announceToScreenReader('Erro: Este slug já está em uso');
            return;
          }
        }

        const result = await handleAsync(
          supabase
            .from(table('brands'))
            .update(brandData)
            .eq('id', editingBrand.id),
          'atualizar marca'
        );

        if (result) {

          
          addNotification('success', 'Marca atualizada com sucesso');
          announceToScreenReader(`Marca ${formData.name} atualizada com sucesso`);
        }
      } else {
        // Check if slug already exists for new brands
        const { data: existingBrand } = await supabase
          .from(table('brands'))
          .select('id')
          .eq('slug', formData.slug)
          .single();
        
        if (existingBrand) {
          setFormErrors({ slug: 'Este slug já está em uso' });
          announceToScreenReader('Erro: Este slug já está em uso');
          return;
        }

        const result = await handleAsync(
          supabase
            .from(table('brands'))
            .insert(brandData),
          'criar marca'
        );

        if (result) {

          
          addNotification('success', 'Marca criada com sucesso');
          announceToScreenReader(`Marca ${formData.name} criada com sucesso`);
        }
      }

      if (!error) {
        await fetchBrands();
        handleCloseForm();
      }
    } catch (err) {
      handleError(err, 'Erro ao salvar marca');
      addNotification('error', 'Erro ao salvar marca', 'Tente novamente.');
    } finally {
      setSubmitting(false);
      stopLoading();
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmDialog(
      'Tem certeza que deseja excluir esta marca?',
      'Esta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;

    try {
      startLoading('Excluindo marca...');
      
      const result = await handleAsync(
        supabase
          .from(table('brands'))
          .delete()
          .eq('id', id),
        'excluir marca'
      );

      if (result) {

        
        addNotification('success', 'Marca excluída com sucesso');
        announceToScreenReader('Marca excluída com sucesso');
        await fetchBrands();
      }
    } catch (err) {
      handleError(err, 'Erro ao excluir marca');
      addNotification('error', 'Erro ao excluir marca', 'Tente novamente.');
    } finally {
      stopLoading();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBrands.size === 0) return;
    
    const confirmed = await showConfirmDialog(
      `Tem certeza que deseja excluir ${selectedBrands.size} marcas?`,
      'Esta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;

    try {
      startLoading(`Excluindo ${selectedBrands.size} marcas...`);
      
      const result = await handleAsync(
        supabase
          .from(table('brands'))
          .delete()
          .in('id', Array.from(selectedBrands)),
        'excluir marcas em massa'
      );

      if (result) {
        addNotification('success', `${selectedBrands.size} marcas excluídas com sucesso`);
        announceToScreenReader(`${selectedBrands.size} marcas excluídas com sucesso`);
        setSelectedBrands(new Set());
        await fetchBrands();
      }
    } catch (err) {
      handleError(err, 'Erro ao excluir marcas em massa');
      addNotification('error', 'Erro ao excluir marcas', 'Tente novamente.');
    } finally {
      stopLoading();
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBrand(null);
    setFormData({
      name: '',
      slug: '',
      logo_url: ''
    });
    setFormErrors({});
    clearError();
    // Reset upload states
    setLogoMethod('url');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || '',
      slug: brand.slug || '',
      logo_url: brand.logo_url || ''
    });
    // Se já tem logo URL, manter o método URL
    setLogoMethod(brand.logo_url ? 'url' : 'url');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowForm(true);
    announceToScreenReader(`Editando marca ${brand.name}`);
  };

  // Funções para upload de logo
  const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return { isValid: false, error: 'Tipo de arquivo inválido. Use: JPG, PNG, GIF, SVG ou WebP.' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'Arquivo muito grande. Máximo: 5MB.' };
    }

    return { isValid: true };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setFormErrors(prev => ({ ...prev, logo_file: validation.error! }));
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.logo_file;
      return newErrors;
    });
  };

  const uploadLogoToStorage = async (file: File): Promise<string | null> => {
    try {
      setUploadingLogo(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error } = await supabase.storage
        .from('brand-logos')
        .upload(filePath, file, { contentType: file.type, upsert: true });

      if (error) {
        const msg = String(error.message || '');
        if (msg.includes('bucket') || msg.includes('not found')) {
          try {
            const { error: createError } = await supabase.rpc('create_bucket_if_not_exists', {
              bucket_name: 'brand-logos',
              is_public: true,
              file_size_limit: 5242880,
              allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
            });
            if (createError) {
              throw createError;
            }
            const { error: retryError } = await supabase.storage
              .from('brand-logos')
              .upload(filePath, file, { contentType: file.type, upsert: true });
            if (retryError) {
              throw retryError;
            }
          } catch (e) {
            throw e instanceof Error ? e : new Error('Falha ao criar bucket brand-logos');
          }
        } else {
          throw error;
        }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      handleError(err, 'Erro ao fazer upload do logo');
      addNotification('error', 'Erro ao fazer upload do logo', 'Tente novamente.');
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const uploadBase64Logo = async (base64Url: string): Promise<string> => {
    const matches = base64Url.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Imagem base64 inválida');
    }
    const mimeType = matches[1];
    const base64Data = matches[2];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const fileExt = mimeType.split('/')[1] || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
    const filePath = `logos/${fileName}`;
    const { error } = await supabase.storage
      .from('brand-logos')
      .upload(filePath, blob);
    if (error) {
      const msg = String(error.message || '');
      if (msg.includes('row-level security') || msg.includes('RLS')) {
        throw new Error('Sem permissão para upload');
      }
      if (msg.includes('bucket') || msg.includes('not found')) {
        try {
          const { error: createError } = await supabase.rpc('create_bucket_if_not_exists', {
            bucket_name: 'brand-logos',
            is_public: true,
            file_size_limit: 5242880,
            allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
          });
          if (createError) {
            throw createError;
          }
          const { error: retryError } = await supabase.storage
            .from('brand-logos')
            .upload(filePath, blob);
          if (retryError) {
            throw retryError;
          }
        } catch (e) {
          throw e instanceof Error ? e : new Error('Falha ao criar bucket brand-logos');
        }
      } else {
        throw error;
      }
    }
    const { data: { publicUrl } } = supabase.storage
      .from('brand-logos')
      .getPublicUrl(filePath);
    return publicUrl;
  };

  const processLogoUrl = async (url: string): Promise<string> => {
    const MAX_URL_LENGTH = 1024;
    if (!url) return '';
    if (url.startsWith('data:')) {
      try {
        const uploadedUrl = await uploadBase64Logo(url);
        return uploadedUrl;
      } catch {
        return '';
      }
    }
    if (url.length > MAX_URL_LENGTH) {
      try {
        const urlObj = new URL(url);
        const essentialParams = ['w', 'h', 'width', 'height', 'size', 'quality', 'format'];
        const newUrl = new URL(urlObj.origin + urlObj.pathname);
        essentialParams.forEach(param => {
          if (urlObj.searchParams.has(param)) {
            newUrl.searchParams.set(param, urlObj.searchParams.get(param)!);
          }
        });
        const processedUrl = newUrl.toString();
        if (processedUrl.length > MAX_URL_LENGTH) {
          return urlObj.origin + urlObj.pathname;
        }
        return processedUrl;
      } catch {
        return url.substring(0, MAX_URL_LENGTH);
      }
    }
    return url;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: !editingBrand ? generateSlug(name) : prev.slug
    }));
    clearError();
    
    // Clear error for this field
    if (formErrors.name) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.name;
        return newErrors;
      });
    }
  };

  const toggleBrandSelection = (id: string) => {
    const newSelected = new Set(selectedBrands);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBrands(newSelected);
  };

  const selectAllBrands = () => {
    if (selectedBrands.size === filteredBrands.length) {
      setSelectedBrands(new Set());
    } else {
      setSelectedBrands(new Set(filteredBrands.map(b => b.id)));
    }
  };

  const exportToCSV = async () => {
    try {
      startLoading('Preparando exportação...');
      
      const headers = ['ID', 'Nome', 'Slug', 'Logo URL', 'Criado em'];
      const rows = filteredBrands.map(brand => [
        brand.id,
        `"${brand.name}"`,
        `"${brand.slug}"`,
        `"${brand.logo_url || ''}"`,
        new Date(brand.created_at || '').toLocaleDateString('pt-BR')
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `marcas_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      

      
      addNotification('success', `Exportação concluída: ${filteredBrands.length} registros`);
      announceToScreenReader(`Exportação concluída: ${filteredBrands.length} registros exportados`);
    } catch (err) {
      handleError(err, 'Erro ao exportar marcas');
      addNotification('error', 'Erro ao exportar marcas', 'Tente novamente.');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <LoadingSpinner size="lg" ariaLabel="Carregando marcas" />
        <span className="sr-only">Carregando marcas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert" aria-live="assertive">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" aria-hidden="true" />
          <span className="text-red-800">{error instanceof Error ? error.message : String(error)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Gestão de Marcas">
      <LoadingOverlay isLoading={isGlobalLoading} message={isGlobalLoading ? 'Processando...' : ''} />
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification}
        position="top-right"
      />
      
      {/* Skip Link para navegação rápida */}
      <a 
        href="#brand-list" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Ir para lista de marcas
      </a>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestão de Marcas</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Gerencie as marcas dos produtos da sua loja</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="Mostrar filtros de marcas"
            disabled={isGlobalLoading}
          >
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            Filtros
          </button>
          
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="Exportar marcas para CSV"
            disabled={isGlobalLoading}
          >
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Exportar
          </button>
          
          {selectedBrands.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              aria-label={`Excluir ${selectedBrands.size} marcas selecionadas`}
              disabled={isGlobalLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Excluir ({selectedBrands.size})
            </button>
          )}
          
          <button
            onClick={() => {
              setShowForm(true);
              setEditingBrand(null);
              setFormData({ name: '', slug: '', logo_url: '' });
              setFormErrors({});
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="Criar nova marca"
            disabled={isGlobalLoading}
            accessKey="n"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Nova Marca
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filtros e Busca</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search-brands" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                <input
                  id="search-brands"
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Buscar marcas..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Buscar marcas por nome ou slug"
                  disabled={isGlobalLoading}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <select
                id="sort-by"
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Ordenar marcas por"
                disabled={isGlobalLoading}
              >
                <option value="name">Nome</option>
                <option value="slug">Slug</option>
                <option value="created_at">Data de Criação</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-2">
                Ordem
              </label>
              <select
                id="sort-order"
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Ordem de classificação"
                disabled={isGlobalLoading}
              >
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600" role="status" aria-live="polite">
              {filteredBrands.length} marca(s) encontrada(s)
              {filters.search && ` para "${filters.search}"`}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({
                  search: '',
                  sortBy: 'name',
                  sortOrder: 'asc'
                })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Limpar filtros de marcas"
                disabled={isGlobalLoading}
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Marcas */}
      <div id="brand-list" className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Tabela de marcas">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedBrands.size === filteredBrands.length && filteredBrands.length > 0}
                    onChange={selectAllBrands}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Selecionar todas as marcas"
                    disabled={isGlobalLoading}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marca
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Logo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBrands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedBrands.has(brand.id)}
                      onChange={() => toggleBrandSelection(brand.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      aria-label={`Selecionar marca ${brand.name}`}
                      disabled={isGlobalLoading}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {brand.logo_url && (
                        <img
                          src={brand.logo_url}
                          alt={`Logo da marca ${brand.name}`}
                          className="h-10 w-10 rounded-lg object-cover mr-3"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded" aria-label={`Slug: ${brand.slug}`}>{brand.slug}</code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {brand.logo_url ? (
                      <a
                        href={brand.logo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title={`Ver logo da marca ${brand.name}`}
                        aria-label={`Ver logo da marca ${brand.name} (abre em nova aba)`}
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-gray-400" aria-label="Sem logo">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {brand.created_at ? new Date(brand.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(brand)}
                        className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title={`Editar marca ${brand.name}`}
                        aria-label={`Editar marca ${brand.name}`}
                        disabled={isGlobalLoading}
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDelete(brand.id)}
                        className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title={`Excluir marca ${brand.name}`}
                        aria-label={`Excluir marca ${brand.name}`}
                        disabled={isGlobalLoading}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredBrands.length === 0 && (
          <div className="text-center py-12" role="status" aria-live="polite">
            <Building className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma marca encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando uma nova marca'
              }
            </p>
            {!filters.search && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingBrand(null);
                  setFormData({ name: '', slug: '', logo_url: '' });
                  setFormErrors({});
                }}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-label="Criar primeira marca"
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Criar Marca
              </button>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="brand-form-title">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 id="brand-form-title" className="text-xl font-bold text-gray-900">
                  {editingBrand ? 'Editar Marca' : 'Nova Marca'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  aria-label="Fechar formulário"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
              {/* Informações Básicas */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Marca</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="brand-name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Marca *
                    </label>
                    <input
                      id="brand-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nome da marca"
                      required
                      aria-invalid={!!formErrors.name}
                      aria-describedby={formErrors.name ? 'name-error' : undefined}
                      disabled={isGlobalLoading}
                    />
                    {formErrors.name && (
                      <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="brand-slug" className="block text-sm font-medium text-gray-700 mb-2">
                      Slug *
                    </label>
                    <input
                      id="brand-slug"
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.slug ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="slug-da-marca"
                      required
                      aria-invalid={!!formErrors.slug}
                      aria-describedby={formErrors.slug ? 'slug-error' : 'slug-help'}
                      disabled={isGlobalLoading}
                    />
                    {formErrors.slug && (
                      <p id="slug-error" className="mt-1 text-sm text-red-600" role="alert">{formErrors.slug}</p>
                    )}
                    <p id="slug-help" className="mt-1 text-xs text-gray-500">
                      O slug será usado para URLs amigáveis. Use apenas letras minúsculas, números e hífens.
                    </p>
                  </div>

                  {/* Seleção de método do logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo da Marca
                    </label>
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
                      <button
                        type="button"
                        onClick={() => setLogoMethod('url')}
                        className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          logoMethod === 'url'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        aria-label="Usar URL para logo"
                        disabled={isGlobalLoading}
                      >
                        <Link className="h-4 w-4 mr-2" />
                        URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoMethod('upload')}
                        className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          logoMethod === 'upload'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        aria-label="Fazer upload de logo"
                        disabled={isGlobalLoading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </button>
                    </div>

                    {/* Campo URL */}
                    {logoMethod === 'url' && (
                      <div>
                        <input
                          id="brand-logo"
                          type="url"
                          value={formData.logo_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            formErrors.logo_url ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="https://exemplo.com/logo.png"
                          aria-invalid={!!formErrors.logo_url}
                          aria-describedby={formErrors.logo_url ? 'logo-error' : 'logo-help'}
                          disabled={isGlobalLoading}
                        />
                        {formErrors.logo_url && (
                          <p id="logo-error" className="mt-1 text-sm text-red-600" role="alert">{formErrors.logo_url}</p>
                        )}
                        <p id="logo-help" className="mt-1 text-xs text-gray-500">
                          URL da imagem do logo da marca (formatos recomendados: PNG, JPG, SVG)
                        </p>
                      </div>
                    )}

                    {/* Campo Upload */}
                    {logoMethod === 'upload' && (
                      <div>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="logo-file-input"
                            disabled={isGlobalLoading || uploadingLogo}
                          />
                          <label
                            htmlFor="logo-file-input"
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <FileImage className="h-12 w-12 text-gray-400 mb-2" />
                            <span className="text-sm font-medium text-gray-700">
                              {selectedFile ? selectedFile.name : 'Clique para selecionar uma imagem'}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              PNG, JPG, GIF, SVG, WebP (máx. 5MB)
                            </span>
                          </label>
                        </div>
                        {formErrors.logo_file && (
                          <p className="mt-1 text-sm text-red-600" role="alert">{formErrors.logo_file}</p>
                        )}
                        {uploadingLogo && (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <LoadingSpinner size="sm" className="mr-2" />
                            Fazendo upload...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pré-visualização do Logo */}
              {(formData.logo_url || selectedFile) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pré-visualização do Logo</h3>
                  <div className="flex justify-center">
                    {logoMethod === 'url' && formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt="Pré-visualização do logo"
                        className="max-h-32 max-w-48 object-contain rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : logoMethod === 'upload' && selectedFile ? (
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Pré-visualização do logo"
                        className="max-h-32 max-w-48 object-contain rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className="hidden text-center text-gray-500">
                      <ImageIcon className="h-16 w-16 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Não foi possível carregar a imagem</p>
                      <p className="text-xs">
                        {logoMethod === 'url' ? 'Verifique se a URL está correta' : 'Verifique o arquivo selecionado'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Erros e Ações */}
              {formErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert" aria-live="assertive">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" aria-hidden="true" />
                    <span className="text-red-800">{formErrors.submit}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  aria-label="Cancelar operação"
                  disabled={isGlobalLoading}
                >
                  Cancelar
                </button>
                <LoadingButton
                  type="submit"
                  isLoading={submitting}
                  disabled={isGlobalLoading}
                  variant="primary"
                  loadingText={editingBrand ? 'Atualizando...' : 'Criando...'}
                  aria-label={editingBrand ? 'Atualizar marca' : 'Criar marca'}
                >
                  <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                  {editingBrand ? 'Atualizar Marca' : 'Criar Marca'}
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
