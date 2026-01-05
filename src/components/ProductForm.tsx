import React, { useState, useEffect, useRef } from 'react';
import { Package, Camera, Tag, FileText, Settings, Check, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';
import WysiwygEditor from './WysiwygEditor';
import UnifiedImageUpload from './UnifiedImageUpload';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { table } from '../lib/schema';

export interface ProductFormData {
  id?: string;
  product_name: string;
  description: string;
  category_id: string;
  subcategory_id: string;
  active: boolean;
  featured_in_dropdown: boolean;
  featured_on_homepage: boolean;
  clearance_sale: boolean;
  images: ProductImageForm[];
  slug: string;
  brand?: string;
  technical_specifications?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  short_description?: string;
  key_features?: string;
  model?: string;
  sku_code?: string;
  price?: number;
}

export interface ProductImageForm {
  id?: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
}

interface ImageItem {
  id: string;
  url: string;
  type: 'file' | 'url';
  file?: File;
}

export interface Category {
  id: string | number;
  name: string;
  parent_id?: string | number;
}

// Tabela de marcas no Supabase
interface Brand {
  id: string | number;
  name: string;
  slug?: string;
}

interface ProductFormProps {
  initialData?: ProductFormData;
  categories: Category[];
  subcategories: Category[];
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  onCategoryChange: (categoryId: string) => void;
  onAiGenerate?: (data: ProductFormData) => void;
  aiLoading?: boolean;
  aiError?: string | null;
  loading?: boolean;
}

interface FormSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  completed: boolean;
  fields: string[];
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  subcategories,
  onSubmit,
  onCancel,
  onCategoryChange,
  onAiGenerate,
  aiLoading = false,
  aiError = null,
  loading = false
}) => {
  const [formData, setFormData] = useState<ProductFormData>(() => {
    const defaultData: ProductFormData = {
      product_name: '',
      description: '',
      category_id: '',
      subcategory_id: '',
      active: true,
      featured_in_dropdown: false,
      featured_on_homepage: false,
      clearance_sale: false,
      images: [],
      slug: '',
      brand: '',
      technical_specifications: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: ''
    };
    
    return initialData ? { ...defaultData, ...initialData } : defaultData;
  });

  // Sincronizar dados iniciais vindos do Admin sem sobrescrever campos já digitados pelo usuário.
  // Evita o bug onde ao mudar a categoria os campos (ex.: nome do produto) eram apagados.
  const initializedFromPropsRef = useRef(false);
  useEffect(() => {
    if (!initialData) return;

    setFormData(prev => {
      // Primeira hidratação: aplica as props recebidas (abrir modal ao editar produto, etc.)
      if (!initializedFromPropsRef.current) {
        initializedFromPropsRef.current = true;
        return { ...prev, ...initialData };
      }

      // Atualizações subsequentes: aplicar apenas campos esperados de atualizações externas
      // (ex.: mudança de categoria no Admin, conteúdo gerado pela IA), sem sobrescrever entradas locais.
      const allowlist: (keyof ProductFormData)[] = [
        'category_id',
        'subcategory_id',
        'images',
        'description',
        'technical_specifications',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'brand',
        'short_description',
        'key_features',
        'model',
        'sku_code'
      ];

      const changes: Partial<ProductFormData> = {};
      for (const key of allowlist) {
        const nextVal = initialData[key];
        // Apenas atualiza se o valor vindo de fora for diferente
        if (typeof nextVal !== 'undefined' && nextVal !== prev[key]) {
          (changes as any)[key] = nextVal as any;
        }
      }

      return { ...prev, ...changes };
    });
  }, [initialData]);

  const [activeSection, setActiveSection] = useState<string>('basic');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<number>(0);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [unifiedImages, setUnifiedImagesState] = useState<ImageItem[]>([]);

  // Estado local para marcas
  const [brandOptions, setBrandOptions] = useState<Brand[]>([]);
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  // Carregar marcas do banco
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const { data, error } = await supabase
          .from(table('brands'))
          .select('id,name,slug')
          .order('name');

        if (!error && Array.isArray(data)) {
          const merged = [...data];
          if (initialData?.brand && !merged.some(b => b.name === initialData.brand)) {
            merged.unshift({ id: initialData.brand, name: initialData.brand });
          }
          setBrandOptions(merged);
        } else {
          // Fallback local
          if (initialData?.brand) {
            setBrandOptions([{ id: initialData.brand, name: initialData.brand }]);
          }
        }
      } catch {
        if (initialData?.brand) {
          setBrandOptions([{ id: initialData.brand, name: initialData.brand }]);
        }
      }
    };
    loadBrands();
  }, [initialData?.brand]);

  // Converter imagens do formato antigo para novo formato unificado
  useEffect(() => {
    if (formData.images && formData.images.length > 0) {
      const convertedImages: ImageItem[] = formData.images.map((img, index) => ({
        id: img.id || `img-${index}-${Date.now()}`,
        url: img.image_url,
        type: img.image_url.startsWith('http') ? 'url' : 'file'
      }));
      setUnifiedImagesState(convertedImages);
    }
  }, [formData.images]);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const saveNewBrand = async () => {
    const name = newBrandName.trim();
    if (!name) return;
    try {
      let newOption: Brand = { id: name, name };
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from(table('brands'))
          .insert([{ name, slug: slugify(name) }])
          .select('id,name,slug')
          .single();
        if (!error && data) {
          newOption = data as Brand;
        }
      }
      setBrandOptions(prev => {
        const map = new Map<string, Brand>();
        [...prev, newOption].forEach(b => map.set(b.name, b));
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
      });
      handleInputChange('brand', name);
      setShowNewBrandInput(false);
      setNewBrandName('');
    } catch {
      // Fallback local
      setBrandOptions(prev => {
        if (prev.some(b => b.name === name)) return prev;
        return [{ id: name, name }, ...prev];
      });
      handleInputChange('brand', name);
      setShowNewBrandInput(false);
      setNewBrandName('');
    }
  };

  const sections: FormSection[] = [
    {
      id: 'basic',
      title: 'Informações Básicas',
      icon: <Package className="w-5 h-5" />,
      completed: false,
      fields: ['product_name', 'category_id', 'subcategory_id', 'slug', 'brand']
    },
    {
      id: 'content',
      title: 'Conteúdo do Produto',
      icon: <FileText className="w-5 h-5" />,
      completed: false,
      fields: ['description', 'technical_specifications']
    },
    {
      id: 'media',
      title: 'Imagens e Mídia',
      icon: <Camera className="w-5 h-5" />,
      completed: false,
      fields: ['images']
    },
    {
      id: 'seo',
      title: 'SEO e Metadados',
      icon: <Tag className="w-5 h-5" />,
      completed: false,
      fields: ['meta_title', 'meta_description', 'meta_keywords']
    },
    {
      id: 'additional',
      title: 'Informações Adicionais',
      icon: <Settings className="w-5 h-5" />,
      completed: false,
      fields: ['active', 'featured_in_dropdown', 'featured_on_homepage', 'clearance_sale']
    }
  ];

  // Auto-focus no primeiro campo ao montar
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Calcular progresso
  useEffect(() => {
    const allFields = sections.flatMap(section => section.fields);
    const filledFields = allFields.filter(field => {
      const value = formData[field as keyof ProductFormData];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return true; // Boolean fields are always considered filled
      if (typeof value === 'string') return value.trim().length > 0;
      return !!value;
    });
    
    setProgress((filledFields.length / allFields.length) * 100);
  }, [formData, sections]);

  // Validação em tempo real
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'product_name':
        return !value || value.trim().length < 3 ? 'Nome do produto deve ter pelo menos 3 caracteres' : '';
      case 'category_id':
        return !value ? 'Selecione uma categoria' : '';
      case 'subcategory_id':
        return !value ? 'Selecione uma subcategoria' : '';
      case 'description':
        return !value || value.trim().length < 10 ? 'Descrição deve ter pelo menos 10 caracteres' : '';
      case 'meta_title':
        return value && value.length > 60 ? 'Meta título deve ter no máximo 60 caracteres' : '';
      case 'meta_description':
        return value && value.length > 160 ? 'Meta descrição deve ter no máximo 160 caracteres' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validação em tempo real
    const error = validateField(field, value);
    setValidationErrors(prev => ({ ...prev, [field]: error }));

    // Gerar slug automaticamente ao digitar o nome
    if (field === 'product_name' && !initialData?.slug) {
      const slug = value.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    handleInputChange('category_id', categoryId);
    handleInputChange('subcategory_id', ''); // Reset subcategory
    onCategoryChange(categoryId);
  };

  const handleUnifiedImagesChange = (newImages: ImageItem[]) => {
    setUnifiedImagesState(newImages);
    
    const productImages: ProductImageForm[] = newImages.map((img, index) => ({
      id: img.id.startsWith('img-') ? undefined : img.id,
      image_url: img.url,
      alt_text: formData.product_name || 'Imagem do produto',
      sort_order: index,
      is_primary: index === 0
    }));
    
    handleInputChange('images', productImages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação final
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof ProductFormData]);
      if (error) errors[field] = error;
    });
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Ir para a primeira seção com erro
      const firstErrorField = Object.keys(errors)[0];
      const errorSection = sections.find(section => 
        section.fields.includes(firstErrorField)
      );
      if (errorSection) {
        setActiveSection(errorSection.id);
      }
      return;
    }
    
    onSubmit(formData);
  };

  const getSectionStatus = (section: FormSection) => {
    const sectionFields = section.fields;
    const filledFields = sectionFields.filter(field => {
      const value = formData[field as keyof ProductFormData];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return true;
      if (typeof value === 'string') return value.trim().length > 0;
      return !!value;
    });
    
    if (filledFields.length === sectionFields.length) return 'completed';
    if (filledFields.length > 0) return 'partial';
    return 'empty';
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const parentCategories = categories.filter(cat => !cat.parent_id);
  const filteredSubcategories = formData.category_id 
    ? subcategories.filter(sub => sub.parent_id?.toString() === formData.category_id)
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex">
        {/* Sidebar com navegação por seções */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {initialData ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <div className="text-sm text-gray-600 mb-4">
              Preencha as informações do produto
            </div>
            
            {/* Barra de progresso */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {sections.map((section) => {
              const status = getSectionStatus(section);
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        status === 'completed' ? 'bg-green-100 text-green-600' :
                        status === 'partial' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {status === 'completed' ? <Check className="w-4 h-4" /> : section.icon}
                      </div>
                      <span className="font-medium">{section.title}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${
                      isActive ? 'rotate-90' : ''
                    }`} />
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo do formulário */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Seção: Informações Básicas */}
            <div id="section-basic" className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
                  <p className="text-sm text-gray-600">Informações essenciais do produto</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Produto *
                  </label>
                  <div className="relative">
                    <input
                      ref={firstInputRef}
                      id="product_name"
                      type="text"
                      value={formData.product_name}
                      onChange={(e) => handleInputChange('product_name', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        validationErrors.product_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ex: Liquidificador Industrial 2 Litros"
                      required
                    />
                    {validationErrors.product_name && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.product_name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.product_name}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">O nome será usado para gerar o slug automaticamente</p>
                </div>

                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria Principal *
                  </label>
                  <div className="relative">
                    <select
                      id="category_id"
                      value={formData.category_id}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        validationErrors.category_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {parentCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.category_id && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.category_id && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.category_id}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="subcategory_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategoria *
                  </label>
                  <div className="relative">
                    <select
                      id="subcategory_id"
                      value={formData.subcategory_id}
                      onChange={(e) => handleInputChange('subcategory_id', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        validationErrors.subcategory_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                      disabled={!formData.category_id}
                    >
                      <option value="">Selecione uma subcategoria</option>
                      {filteredSubcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.subcategory_id && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.subcategory_id && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.subcategory_id}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                    Slug
                  </label>
                  <input
                    id="slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    placeholder="sera-gerado-automaticamente"
                    readOnly={!initialData?.slug}
                  />
                  <p className="mt-1 text-xs text-gray-500">URL amigável do produto</p>
                </div>

                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <select
                    id="brand"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors border-gray-300"
                    value={formData.brand || ''}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                  >
                    <option value="">Selecione uma marca</option>
                    {brandOptions.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                  <div className="mt-2">
                    {!showNewBrandInput ? (
                      <button
                        type="button"
                        onClick={() => { setShowNewBrandInput(true); setNewBrandName(''); }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Adicionar nova marca
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={newBrandName}
                          onChange={(e) => setNewBrandName(e.target.value)}
                          placeholder="Nome da nova marca"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={saveNewBrand}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowNewBrandInput(false); setNewBrandName(''); }}
                          className="px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção: Conteúdo do Produto */}
            <div id="section-content" className="space-y-6 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Conteúdo do Produto</h3>
                    <p className="text-sm text-gray-600">Descrições e características do produto</p>
                  </div>
                </div>
                {onAiGenerate && (
                  <button
                    type="button"
                    onClick={() => onAiGenerate && onAiGenerate(formData)}
                    disabled={aiLoading || !formData.product_name || !formData.category_id}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      aiLoading || !formData.product_name || !formData.category_id
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-sm'
                    }`}
                  >
                    {aiLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {aiLoading ? 'Gerando...' : 'Gerar com IA'}
                  </button>
                )}
              </div>

              {aiError && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {aiError}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição Completa *
                  </label>
                  <div className="border rounded-lg">
                    <WysiwygEditor
                      value={formData.description}
                      onChange={(value) => handleInputChange('description', value)}
                      placeholder="Descreva detalhadamente o produto, suas funcionalidades e benefícios..."
                      required
                    />
                  </div>
                  {validationErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Uma descrição detalhada ajuda na conversão</p>
                </div>

                

                <div>
                  <label htmlFor="technical_specifications" className="block text-sm font-medium text-gray-700 mb-2">
                    Especificações Técnicas
                  </label>
                  <textarea
                    id="technical_specifications"
                    value={formData.technical_specifications || ''}
                    onChange={(e) => handleInputChange('technical_specifications', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Capacidade: 2L&#10;Potência: 1500W&#10;Dimensões: 30x20x25cm&#10;Peso: 3.5kg"
                  />
                  <p className="mt-1 text-xs text-gray-500">Use quebras de linha para separar especificações</p>
                </div>
              </div>
            </div>

            {/* Seção: Imagens e Mídia */}
            <div id="section-media" className="space-y-6 pt-8 border-t border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Imagens e Mídia</h3>
                  <p className="text-sm text-gray-600">Adicione imagens do produto (máximo 5)</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagens do Produto
                  </label>
                  <UnifiedImageUpload
                    images={unifiedImages}
                    onImagesChange={handleUnifiedImagesChange}
                    maxImages={5}
                    maxSizeInMB={5}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Formatos aceitos: JPG, PNG, GIF, WebP • Máximo 5MB por imagem • Arraste para reordenar
                  </p>
                </div>
              </div>
            </div>

            {/* Seção: SEO e Metadados */}
            <div id="section-seo" className="space-y-6 pt-8 border-t border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">SEO e Metadados</h3>
                  <p className="text-sm text-gray-600">Otimize para mecanismos de busca</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Title
                  </label>
                  <div className="relative">
                    <input
                      id="meta_title"
                      type="text"
                      value={formData.meta_title || ''}
                      onChange={(e) => handleInputChange('meta_title', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        validationErrors.meta_title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Título que aparece nos resultados de busca"
                      maxLength={60}
                    />
                    {validationErrors.meta_title && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.meta_title && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.meta_title}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Máximo 60 caracteres</p>
                </div>

                <div>
                  <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    id="meta_description"
                    value={formData.meta_description || ''}
                    onChange={(e) => handleInputChange('meta_description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descrição que aparece nos resultados de busca"
                    maxLength={160}
                  />
                  <p className="mt-1 text-xs text-gray-500">Máximo 160 caracteres</p>
                </div>

                <div className="lg:col-span-2">
                  <label htmlFor="meta_keywords" className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Keywords
                  </label>
                  <input
                    id="meta_keywords"
                    type="text"
                    value={formData.meta_keywords || ''}
                    onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="liquidificador industrial, equipamento cozinha, 2 litros"
                  />
                  <p className="mt-1 text-xs text-gray-500">Palavras-chave separadas por vírgula</p>
                </div>
              </div>
            </div>

            {/* Seção: Informações Adicionais */}
            <div id="section-additional" className="space-y-6 pt-8 border-t border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gray-100 text-gray-600 rounded-lg">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Informações Adicionais</h3>
                  <p className="text-sm text-gray-600">Dados complementares do produto</p>
                </div>
              </div>

              

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Preço e Estoque</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      Preço (R$)
                    </label>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price || ''}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Status e Visibilidade</h4>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => handleInputChange('active', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">Produto Ativo</span>
                    <span className="ml-auto text-xs text-gray-500">Visível no site</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.featured_in_dropdown}
                      onChange={(e) => handleInputChange('featured_in_dropdown', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">Destaque no Menu Dropdown</span>
                    <span className="ml-auto text-xs text-gray-500">Exibe no dropdown</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.featured_on_homepage}
                      onChange={(e) => handleInputChange('featured_on_homepage', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">Destaque na Página Inicial</span>
                    <span className="ml-auto text-xs text-gray-500">Exibe na home</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.clearance_sale}
                      onChange={(e) => handleInputChange('clearance_sale', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">Queima de Estoque</span>
                    <span className="ml-auto text-xs text-gray-500">Exibe em promoções</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Botões de ação fixos */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-6 pb-8 mt-8">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Salvando...' : 'Salvar Produto'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;