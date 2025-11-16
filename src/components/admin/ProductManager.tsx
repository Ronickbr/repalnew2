import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product, Category, Brand } from '../../types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  Upload,
  X,
  HelpCircle,
  Eye,
  EyeOff,
  Package,
  BarChart3,
  Sparkles,
  Anchor
} from 'lucide-react';
import { LoadingSpinner, LoadingOverlay } from './LoadingSpinner';
import NotificationContainer from './Notification';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useNotifications } from '../../hooks/useNotifications';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useLoadingState } from '../../hooks/useLoadingState';
import UnifiedImageUpload, { ImageItem } from '../UnifiedImageUpload';

interface ProductFormData {
  name: string;
  description: string;
  category_id: string;
  subcategory_id?: string;
  brand?: string;
  image?: string;
  additional_images?: string[];
  specifications_html?: string;
  featured: boolean;
  featured_in_dropdown: boolean;
  featured_on_homepage: boolean;
  active: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
}

interface ProductFormErrors {
  name?: string;
  category_id?: string;
  image?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
}

const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  // const [loading, setLoading] = useState(true); // Usando isGlobalLoading agora
  // const [error, setError] = useState<string | null>(null); // Usando handleError agora
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category_id: '',
    subcategory_id: undefined,
    brand: undefined,
    image: undefined,
    additional_images: [],
    specifications_html: undefined,
    featured: false,
    featured_in_dropdown: false,
    featured_on_homepage: false,
    active: true,
    seo_title: undefined,
    seo_description: undefined,
    seo_keywords: undefined,
  });

  // Unified image upload state
  const [unifiedImages, setUnifiedImages] = useState<ImageItem[]>([]);
  
  const [, setFormErrors] = useState<ProductFormErrors>({}); // formErrors não é usado diretamente no JSX
  
  // Filters
  const [filters, setFilters] = useState({
    category_id: '',
    brand: '',
    featured: '',
    active: '',
  });
  
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Form sections state
  
  // Image upload states (unified via UnifiedImageUpload)
  
  // Loading state for modal operations
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGenerationMessage, setAiGenerationMessage] = useState('');
  
  // Hooks
  const { handleError, clearError } = useErrorHandler();
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { announceToScreenReader } = useAccessibility(); // trapFocus não está sendo usado no momento
  const { isLoading: isGlobalLoading, startLoading, stopLoading } = useLoadingState();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      startLoading('Carregando dados iniciais...');
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchBrands()
      ]);
    } catch (err) {
      handleError(err, 'loadInitialData');
    } finally {
      stopLoading(); // Importante: parar o loading!
      setIsGeneratingAI(false);
      setAiGenerationMessage('');
    }
  };

  const fetchProducts = async () => {
    try {
      clearError(); // Limpa erro geral
      
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          product_images(url, sort_order)
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply search
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
      }

      // Apply filters
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.brand) {
        query = query.eq('brand', filters.brand);
      }

      if (filters.featured) {
        query = query.eq('featured', filters.featured === 'true');
      }
      if (filters.active) {
        query = query.eq('active', filters.active === 'true');
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw new Error(`Erro ao buscar produtos: ${supabaseError.message}`);
      }

      // Processar dados para converter product_images em additional_images
      const processedData = (data || []).map((product: any) => {
        const additionalImages = product.product_images 
          ? product.product_images
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((img: any) => img.url)
          : [];
        
        return {
          ...product,
          additional_images: additionalImages
        };
      });

      setProducts(processedData);
      announceToScreenReader(`${data?.length || 0} produtos carregados`, 'polite');
    } catch (err) {
      handleError(err, 'fetchProducts');
    }
  };

  const fetchCategories = async () => {
    try {
      clearError(); // Limpa erro geral
      
      const { data, error: supabaseError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (supabaseError) {
        throw new Error(`Erro ao buscar categorias: ${supabaseError.message}`);
      }

      setCategories(data || []);
    } catch (err) {
      handleError(err, 'fetchCategories');
    }
  };

  const fetchBrands = async () => {
    try {
      clearError(); // Limpa erro geral
      
      const { data, error: supabaseError } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (supabaseError) {
        throw new Error(`Erro ao buscar marcas: ${supabaseError.message}`);
      }

      setBrands(data || []);
    } catch (err) {
      handleError(err, 'fetchBrands');
    }
  };

  // Validate form data
  const validateProductForm = (data: ProductFormData): ProductFormErrors => {
    const errors: ProductFormErrors = {};

    if (!data.name.trim()) {
      errors.name = 'Nome do produto é obrigatório';
    } else if (data.name.length > 255) {
      errors.name = 'Nome não pode ter mais de 255 caracteres';
    }

    if (!data.category_id || data.category_id.trim() === '') {
      errors.category_id = 'Categoria é obrigatória';
    }

    // Validate image URL if provided
    if (data.image && !isValidUrl(data.image)) {
      errors.image = 'URL da imagem inválida';
    }

    // Validate SEO fields if provided
    if (data.seo_title && data.seo_title.length > 255) {
      errors.seo_title = 'Título SEO não pode ter mais de 255 caracteres';
    }

    if (data.seo_description && data.seo_description.length > 500) {
      errors.seo_description = 'Descrição SEO não pode ter mais de 500 caracteres';
    }

    if (data.seo_keywords && data.seo_keywords.length > 500) {
      errors.seo_keywords = 'Palavras-chave SEO não podem ter mais de 500 caracteres';
    }

    return errors;
  };



  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle form submission

  // Sync unified images to form data
  const syncUnifiedImagesToFormData = (images: ImageItem[]) => {
    if (images.length > 0) {
      const mainImage = images[0]; // Primeira imagem é a principal
      const additionalImages = images.slice(1).map(img => img.url);
      
      setFormData(prev => ({
        ...prev,
        image: mainImage.url,
        additional_images: additionalImages
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        image: undefined,
        additional_images: []
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form
      const errors = validateProductForm(formData);
      setFormErrors(errors);
      
      if (Object.keys(errors).length > 0) {
        const firstError = Object.values(errors)[0];
        announceToScreenReader(`Erro no formulário: ${firstError}`, 'assertive');
        addNotification('error', 'Por favor, corrija os erros no formulário');
        return;
      }

      startLoading('Processando produto...');
      if (editingProduct) {
        await updateProduct();
      } else {
        await createProduct();
      }
      stopLoading();
    } catch (err) {
      handleError(err, 'handleSubmit');
    }
  };

  const createProduct = async () => {
    try {
      // Remover additional_images dos dados do produto principal
      const { additional_images, ...productDataWithoutImages } = formData;
      
      // Gerar slug a partir do nome
      const baseSlug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .trim();

      // Verificar se o slug já existe e gerar um único se necessário
      let slug = baseSlug;
      let counter = 1;
      
      console.log('Verificando unicidade do slug:', baseSlug);
      
      try {
        while (true) {
          const { data: existingProduct, error: slugCheckError } = await supabase
            .from('products')
            .select('id')
            .eq('slug', slug)
            .maybeSingle(); // Use maybeSingle() em vez de single() para evitar erro quando não encontra
          
          console.log('Resultado da verificação:', { existingProduct, slugCheckError });
          
          if (slugCheckError) {
            console.warn('Erro ao verificar slug:', slugCheckError);
            // Se houver erro na verificação, usar timestamp para garantir unicidade
            slug = `${baseSlug}-${Date.now()}`;
            break;
          }
          
          if (!existingProduct) {
            console.log('Slug disponível:', slug);
            break; // Slug está disponível
          }
          
          console.log('Slug já existe, tentando alternativa:', slug);
          slug = `${baseSlug}-${counter}`;
          counter++;
          
          if (counter > 100) {
            // Usar timestamp como fallback para garantir unicidade
            slug = `${baseSlug}-${Date.now()}`;
            console.log('Limite de tentativas atingido, usando timestamp:', slug);
            break;
          }
        }
      } catch (error) {
        console.warn('Exceção ao verificar slug:', error);
        // Em caso de erro, usar timestamp para garantir unicidade
        slug = `${baseSlug}-${Date.now()}`;
      }
      
      console.log('Slug final:', slug);

      const productData = {
        ...productDataWithoutImages,
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : undefined,
        brand: formData.brand || undefined,
        image: formData.image || undefined,
        slug: slug,
        seo_title: formData.seo_title?.trim() || undefined,
        seo_description: formData.seo_description?.trim() || undefined,
        seo_keywords: formData.seo_keywords?.trim() || undefined,
        // Campos de preço e estoque serão gerenciados em outro módulo
      };

      const { data, error: supabaseError } = await supabase
        .from('products')
        .insert([productData])
        .select(`
          *,
          categories(name)
        `)
        .single();

      if (supabaseError) {
        if (supabaseError.code === '23505') {
          throw new Error('SKU já existe. Por favor, escolha um SKU único.');
        }
        throw new Error(`Erro ao criar produto: ${supabaseError.message}`);
      }

      if (data) {
        // Salvar imagens adicionais na tabela product_images
        if (formData.additional_images && formData.additional_images.length > 0) {
          const validImages = formData.additional_images.filter(img => img && img.trim() !== '');
          if (validImages.length > 0) {
            const imageRecords = validImages.map((url, index) => ({
              product_id: data.id,
              url: url,
              sort_order: index
            }));
            
            const { error: imagesError } = await supabase
              .from('product_images')
              .insert(imageRecords);
              
            if (imagesError) {
              console.error('Erro ao salvar imagens adicionais:', imagesError);
              // Não lançar erro para não impedir a criação do produto
            }
          }
        }
        
        setProducts(prev => [data, ...prev]);
        addNotification('success', 'Produto criado com sucesso');
        announceToScreenReader(`Produto ${data.name} criado com sucesso`, 'polite');
        handleCloseForm();
      }
    } catch (err) {
      handleError(err, 'createProduct');
      throw err;
    }
  };

  const updateProduct = async () => {
    if (!editingProduct) return;

    try {
      // Remover additional_images dos dados do produto principal
      const { additional_images, ...productDataWithoutImages } = formData;
      
      const productData = {
        ...productDataWithoutImages,
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : undefined,
        brand: formData.brand || undefined,
        image: formData.image || undefined,
        seo_title: formData.seo_title?.trim() || undefined,
        seo_description: formData.seo_description?.trim() || undefined,
        seo_keywords: formData.seo_keywords?.trim() || undefined,
      };

      const { data, error: supabaseError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)
        .select(`
          *,
          categories(name)
        `)
        .single();

      if (supabaseError) {
        if (supabaseError.code === '23505') {
          throw new Error('SKU já existe. Por favor, escolha um SKU único.');
        }
        throw new Error(`Erro ao atualizar produto: ${supabaseError.message}`);
      }

      if (data) {
        // Atualizar imagens adicionais na tabela product_images
        if (formData.additional_images && formData.additional_images.length > 0) {
          const validImages = formData.additional_images.filter(img => img && img.trim() !== '');
          
          // Primeiro, remover imagens antigas
          const { error: deleteError } = await supabase
            .from('product_images')
            .delete()
            .eq('product_id', editingProduct.id);
            
          if (deleteError) {
            console.error('Erro ao remover imagens antigas:', deleteError);
          }
          
          // Depois, inserir as novas imagens
          if (validImages.length > 0) {
            const imageRecords = validImages.map((url, index) => ({
              product_id: editingProduct.id,
              url: url,
              sort_order: index
            }));
            
            const { error: imagesError } = await supabase
              .from('product_images')
              .insert(imageRecords);
              
            if (imagesError) {
              console.error('Erro ao salvar imagens adicionais:', imagesError);
              // Não lançar erro para não impedir a atualização do produto
            }
          }
        }
        
        setProducts(prev => prev.map(p => p.id === data.id ? data : p));
        addNotification('success', 'Produto atualizado com sucesso');
        announceToScreenReader(`Produto ${data.name} atualizado com sucesso`, 'polite');
        handleCloseForm();
      }
    } catch (err) {
      handleError(err, 'updateProduct');
      throw err;
    }
  };

  const handleDelete = async (product: Product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
    announceToScreenReader(`Preparando para excluir o produto ${product.name}`, 'polite');
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      startLoading('Excluindo produto...');
      const { error: supabaseError } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (supabaseError) {
        throw new Error(`Erro ao excluir produto: ${supabaseError.message}`);
      }

      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      addNotification('success', 'Produto excluído com sucesso');
      announceToScreenReader(`Produto ${productToDelete.name} excluído com sucesso`, 'polite');
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      stopLoading();
    } catch (err) {
      handleError(err, 'confirmDelete');
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) {
      addNotification('warning', 'Selecione pelo menos um produto para excluir');
      return;
    }
    setShowBulkDeleteConfirm(true);
    announceToScreenReader(`Preparando para excluir ${selectedProducts.length} produtos`, 'polite');
  };

  const confirmBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    try {
      startLoading(`Excluindo ${selectedProducts.length} produtos...`);
      const { error: supabaseError } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);

      if (supabaseError) {
        throw new Error(`Erro ao excluir produtos: ${supabaseError.message}`);
      }

      setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
      addNotification('success', `${selectedProducts.length} produtos excluídos com sucesso`);
      announceToScreenReader(`${selectedProducts.length} produtos excluídos com sucesso`, 'polite');
      setSelectedProducts([]);
      setSelectAll(false);
      setShowBulkDeleteConfirm(false);
      stopLoading();
    } catch (err) {
      handleError(err, 'confirmBulkDelete');
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name');

      if (supabaseError) {
        throw new Error(`Erro ao buscar subcategorias: ${supabaseError.message}`);
      }

      setSubcategories(data || []);
    } catch (err) {
      handleError(err, 'fetchSubcategories');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    // Carregar subcategorias da categoria do produto
    if (product.category_id) {
      fetchSubcategories(product.category_id);
    }
    setFormData({
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      subcategory_id: product.subcategory_id,
      brand: product.brand,
      image: product.image,
      additional_images: product.additional_images || [],
      specifications_html: product.specifications_html,
      featured: product.featured,
      featured_in_dropdown: product.featured_in_dropdown || false,
      featured_on_homepage: product.featured_on_homepage || false,
      active: product.active,
      seo_title: product.seo_title,
      seo_description: product.seo_description,
      seo_keywords: product.seo_keywords,
    });
    
    // Sync images to unified format
    const unifiedImages: ImageItem[] = [];
    if (product.image) {
      unifiedImages.push({ id: 'main', url: product.image, type: 'url' });
    }
    if (product.additional_images) {
      product.additional_images.forEach((url, index) => {
        unifiedImages.push({ id: `additional-${index}`, url, type: 'url' });
      });
    }
    setUnifiedImages(unifiedImages);
    
    setFormErrors({});
    setShowForm(true);
    announceToScreenReader(`Editando produto ${product.name}`, 'polite');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category_id: '',
      subcategory_id: undefined,
      brand: undefined,
      image: undefined,
      additional_images: [],
      specifications_html: undefined,
      featured: false,
      featured_in_dropdown: false,
      featured_on_homepage: false,
      active: true,
      seo_title: undefined,
      seo_description: undefined,
      seo_keywords: undefined,
    });
    setUnifiedImages([]); // Clear unified images
    setFormErrors({});
    setSubcategories([]); // Limpa subcategorias ao fechar formulário
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({ ...prev, name }));
    
    // Auto-generate SEO title if empty
    if (!editingProduct && !formData.seo_title) {
      setFormData(prev => ({ 
        ...prev, 
        name,
        seo_title: name.substring(0, 255)
      }));
    }
  };

  // Generate product content using AI
  const generateContentByAI = async () => {
    if (!formData.name || !formData.category_id) {
      addNotification('error', 'Por favor, preencha o nome e categoria do produto primeiro');
      return;
    }

    // Verificar se a API key está configurada
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === '') {
      addNotification('error', 'Chave de API do Gemini não configurada. Verifique o arquivo .env');
      return;
    }

    setIsGeneratingAI(true);
    setAiGenerationMessage('Gerando conteúdo com IA...');
    
    try {
      // Get category name for context
      const category = categories.find(c => c.id === formData.category_id);
      const categoryName = category?.name || '';
      const subcategory = subcategories.find(s => s.id === formData.subcategory_id);
      const subcategoryName = subcategory?.name || '';
      const brandName = formData.brand || '';
      
      const prompt = `Gere uma descrição completa de produto, especificações técnicas e informações SEO para:
      
Nome do Produto: ${formData.name}
Categoria: ${categoryName}
Subcategoria: ${subcategoryName}
Marca: ${brandName}

Por favor, forneça:

1. DESCRIÇÃO DO PRODUTO:
- Crie uma descrição atrativa e persuasiva focada em marketing
- Mínimo 200 palavras
- Destaque os principais benefícios e diferenciais
- Use linguagem persuasiva para conversão
- Inclua os principais atributos e vantagens

2. ESPECIFICAÇÕES TÉCNICAS:
- Busque e liste as especificações técnicas reais deste tipo de produto
- Formate em HTML com lista organizada
- Inclua dimensões, materiais, características técnicas relevantes
- Seja específico e detalhado

3. INFORMAÇÕES SEO:
- Título SEO (máximo 60 caracteres): inclua nome, categoria e marca
- Descrição SEO (máximo 160 caracteres): chamativa com principais benefícios
- Palavras-chave SEO (máximo 6 tags): focadas em conversão e relevância

Formato de resposta obrigatório:
DESCRIÇÃO:
[descrição persuasiva aqui]

ESPECIFICAÇÕES:
[HTML com lista de especificações]

TÍTULO SEO:
[título otimizado aqui]

DESCRIÇÃO SEO:
[descrição otimizada aqui]

PALAVRAS-CHAVE:
[palavras-chave separadas por vírgula]`;

      // Usar Gemini API com modelo gemini-2.5-pro
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4000,
        }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Erro desconhecido' } }));
        console.error('Erro na API do Gemini:', errorData);
        if (response.status === 400 && errorData.error?.message?.includes('API key')) {
          throw new Error('Chave de API do Gemini inválida ou não configurada');
        } else if (response.status === 429) {
          throw new Error('Limite de requisições excedido. Tente novamente mais tarde');
        } else {
          throw new Error(`Erro na API do Gemini: ${errorData.error?.message || 'Erro desconhecido'}`);
        }
      }

      const data = await response.json();
      
      // Verificar se a resposta tem o formato esperado
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error('Resposta inesperada da API do Gemini:', data);
        throw new Error('Formato de resposta inválido da API do Gemini');
      }
      
      const content = data.candidates[0].content.parts[0].text;
      
      if (!content || content.trim() === '') {
        throw new Error('Conteúdo gerado está vazio');
      }
      
      // Parse the response
      const descriptionMatch = content.match(/DESCRIÇÃO:\s*\n?([\s\S]*?)\n?ESPECIFICAÇÕES:/);
      const specificationsMatch = content.match(/ESPECIFICAÇÕES:\s*\n?([\s\S]*?)\n?TÍTULO SEO:/);
      const seoTitleMatch = content.match(/TÍTULO SEO:\s*\n?([\s\S]*?)\n?DESCRIÇÃO SEO:/);
      const seoDescriptionMatch = content.match(/DESCRIÇÃO SEO:\s*\n?([\s\S]*?)\n?PALAVRAS-CHAVE:/);
      const keywordsMatch = content.match(/PALAVRAS-CHAVE:\s*\n?([\s\S]*)/);
      
      if (!descriptionMatch || !specificationsMatch || !seoTitleMatch || !seoDescriptionMatch || !keywordsMatch) {
        console.error('Conteúdo gerado não segue o formato esperado:', content);
        throw new Error('Formato do conteúdo gerado está incompleto. Tente novamente.');
      }
      
      const generatedDescription = descriptionMatch ? descriptionMatch[1].trim() : '';
      const generatedSpecifications = specificationsMatch ? specificationsMatch[1].trim() : '';
      const generatedSeoTitle = seoTitleMatch ? seoTitleMatch[1].trim() : '';
      const generatedSeoDescription = seoDescriptionMatch ? seoDescriptionMatch[1].trim() : '';
      const generatedKeywords = keywordsMatch ? keywordsMatch[1].trim() : '';
      
      // Verificar se algum conteúdo foi gerado
      if (!generatedDescription && !generatedSpecifications && !generatedSeoTitle && !generatedSeoDescription && !generatedKeywords) {
        throw new Error('Nenhum conteúdo foi gerado. Tente novamente com informações mais detalhadas.');
      }
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        description: generatedDescription || prev.description,
        specifications_html: generatedSpecifications || prev.specifications_html,
        seo_title: generatedSeoTitle || prev.seo_title,
        seo_description: generatedSeoDescription || prev.seo_description,
        seo_keywords: generatedKeywords || prev.seo_keywords
      }));
      
      addNotification('success', 'Conteúdo gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      addNotification('error', 'Erro ao gerar conteúdo. Por favor, tente novamente.');
    } finally {
      setIsGeneratingAI(false);
      setAiGenerationMessage('');
    }
  };

  


  // Drag and Drop functions for image reordering
  


  

  // Handle select all products
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
      setSelectAll(false);
    } else {
      setSelectedProducts(products.map(p => p.id));
      setSelectAll(true);
    }
  };

  // Handle individual product selection
  const handleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
      setSelectAll(false);
    } else {
      setSelectedProducts(prev => [...prev, productId]);
    }
  };

  // Export functions
  const exportToCSV = () => {
    try {
      const csvContent = [
        ['ID', 'Nome', 'SKU', 'Categoria', 'Marca', 'Ativo', 'Destaque'],
        ...products.map(product => [
          product.id,
          `"${product.name.replace(/"/g, '""')}"`,
          product.sku,
          product.categories?.name || '',
          product.brand || '',
          product.active ? 'Sim' : 'Não',
          product.featured ? 'Sim' : 'Não'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `produtos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification('success', 'Dados exportados com sucesso');
      announceToScreenReader('Dados exportados para CSV com sucesso', 'polite');
      

    } catch (err) {
      handleError(err, 'exportToCSV');
    }
  };

  const exportToJSON = () => {
    try {
      const jsonContent = JSON.stringify(products, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `produtos_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification('success', 'Dados exportados com sucesso');
      announceToScreenReader('Dados exportados para JSON com sucesso', 'polite');
      

    } catch (err) {
      handleError(err, 'exportToJSON');
    }
  };



  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            if (!showForm) {
              setShowForm(true);
              announceToScreenReader('Abrindo formulário de novo produto', 'polite');
            }
            break;
          case 'f':
            e.preventDefault();
            setShowFilters(!showFilters);
            announceToScreenReader(showFilters ? 'Ocultando filtros' : 'Mostrando filtros', 'polite');
            break;
          case 'e':
            e.preventDefault();
            exportToCSV();
            break;
          case 'x':
            e.preventDefault();
            if (selectedProducts.length > 0) {
              handleBulkDelete();
            }
            break;
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAll();
      } else if (e.key === 'Escape') {
        if (showForm) {
          handleCloseForm();
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (showBulkDeleteConfirm) {
          setShowBulkDeleteConfirm(false);
        } else if (showHelp) {
          setShowHelp(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showForm, showFilters, showDeleteConfirm, showBulkDeleteConfirm, showHelp, selectedProducts, searchTerm, filters, sortBy, sortOrder]);

  // Refetch products when filters or sorting changes
  useEffect(() => {
    fetchProducts();
  }, [searchTerm, filters, sortBy, sortOrder]);

  if (isGlobalLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Carregando produtos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Gestão de Produtos">
      <LoadingOverlay isLoading={isGlobalLoading} message={isGlobalLoading ? 'Processando...' : ''} />
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification}
        position="top-right"
      />
      
      {/* Skip Link para navegação rápida */}
      <a 
        href="#product-list" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Ir para lista de produtos
      </a>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Produtos</h1>
          <p className="text-gray-600 mt-1">Gerencie os produtos da sua loja</p>
          <div className="text-xs text-gray-500 mt-1" role="complementary" aria-label="Atalhos de teclado">
            Atalhos: Alt+N (Novo) • Alt+F (Filtros) • Alt+E (Exportar) • Alt+X (Excluir)
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Ver atalhos e informações de acessibilidade"
            title="Ajuda e atalhos de teclado"
          >
            <HelpCircle className="h-3 w-3 mr-1" aria-hidden="true" />
            Ajuda
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          >
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            Filtros
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Exportar produtos para CSV"
          >
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Exportar CSV
          </button>
          <button
            onClick={exportToJSON}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Exportar produtos para JSON"
          >
            <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
            Exportar JSON
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Criar novo produto"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Pesquisar produtos</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por nome, descrição ou SKU..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Pesquisar produtos por nome, descrição ou SKU"
              />
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                id="filter-category"
                value={filters.category_id}
                onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-brand" className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                id="filter-brand"
                value={filters.brand}
                onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Filtrar por marca"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="filter-featured" className="block text-sm font-medium text-gray-700 mb-1">Destaque</label>
              <select
                id="filter-featured"
                value={filters.featured}
                onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="true">Em destaque</option>
                <option value="false">Normal</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-active" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="filter-active"
                value={filters.active}
                onChange={(e) => setFilters(prev => ({ ...prev, active: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  category_id: '',
                  brand: '',
                  featured: '',
                  active: '',
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div id="product-list" className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Lista de Produtos ({products.length})
          </h2>
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedProducts.length} selecionado(s)
              </span>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                aria-label={`Excluir ${selectedProducts.length} produtos selecionados`}
              >
                <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
                Excluir Selecionados
              </button>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Tabela de produtos">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Selecionar todos os produtos"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imagem
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setSortBy('name');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  aria-sort={sortBy === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Nome
                    {sortBy === 'name' && (
                      <span className="ml-1" aria-hidden="true">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setSortBy('category');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  aria-sort={sortBy === 'category' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Categoria
                    {sortBy === 'category' && (
                      <span className="ml-1" aria-hidden="true">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subcategoria
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr 
                  key={product.id} 
                  className={`hover:bg-gray-50 ${selectedProducts.includes(product.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      aria-label={`Selecionar produto ${product.name}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex-shrink-0 h-12 w-12">
                      {product.image ? (
                        <img 
                          className="h-12 w-12 rounded-lg object-cover" 
                          src={product.image} 
                          alt={product.name}
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMkMyMS4xMDQ2IDIyIDIyIDIxLjEwNDYgMjIgMjBDMjIgMTguODk1NCAyMS4xMDQ2IDE4IDIwIDE4QzE4Ljg5NTQgMTggMTggMTguODk1NCAxOCAyMEMxOCAyMS4xMDQ2IDE4Ljg5NTQgMjIgMjAgMjJaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo=';
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    {product.featured && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                        <BarChart3 className="h-3 w-3 mr-1" aria-hidden="true" />
                        Em destaque
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.categories?.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">-</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        product.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                      {product.active ? (
                        <Eye className="h-4 w-4 text-green-500" aria-hidden="true" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        aria-label={`Editar produto ${product.name}`}
                        title={`Editar ${product.name}`}
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        aria-label={`Excluir produto ${product.name}`}
                        title={`Excluir ${product.name}`}
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
        
        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(filters).some(v => v) 
                ? 'Tente ajustar sua pesquisa ou filtros'
                : 'Comece criando um novo produto'
              }
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Criar Primeiro Produto
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <div className="relative mx-auto p-5 border w-full max-w-2xl bg-white rounded-lg shadow-lg my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 id="help-title" className="text-xl font-bold text-gray-900">
                Ajuda - Gestão de Produtos
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                aria-label="Fechar ajuda"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Atalhos de Teclado</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Alt + N</kbd> - Criar novo produto</li>
                    <li><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Alt + F</kbd> - Mostrar/ocultar filtros</li>
                    <li><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Alt + E</kbd> - Exportar dados</li>
                    <li><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Alt + X</kbd> - Excluir produtos selecionados</li>
                    <li><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl + A</kbd> - Selecionar todos os produtos visíveis</li>
                    <li><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd> - Fechar modal/cancelar ação</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Funcionalidades de Acessibilidade</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Navegação completa por teclado</li>
                    <li>• Leitores de tela compatíveis (ARIA labels)</li>
                    <li>• Alto contraste e foco visível</li>
                    <li>• Anúncios de mudanças para leitores de tela</li>
                    <li>• Validação de formulários com feedback auditivo</li>
                    <li>• Atalhos de teclado para ações rápidas</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Dicas de Uso</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Use os filtros para encontrar produtos rapidamente</li>
                    <li>• Clique nos cabeçalhos das colunas para ordenar</li>
                    <li>• Selecione múltiplos produtos com as checkboxes</li>
                    <li>• Exporte dados para análises externas</li>
                    <li>• Revise as validações antes de salvar</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" role="dialog" aria-modal="true" aria-labelledby="form-title">
          <div className="relative mx-auto p-5 border w-full max-w-4xl bg-white rounded-lg shadow-lg my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 id="form-title" className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                aria-label="Fechar formulário"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex gap-6">
                {/* Side Navigation */}
                <div className="w-64 flex-shrink-0">
                  <nav className="sticky top-6 space-y-2">
                    <a
                      href="#basic-info"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('basic-info')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      <Anchor className="h-4 w-4 mr-2" />
                      Informações Iniciais
                    </a>
                    <a
                      href="#additional-info"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('additional-info')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 border border-gray-200"
                    >
                      <Anchor className="h-4 w-4 mr-2" />
                      Informações Adicionais
                    </a>
                    <a
                      href="#seo-info"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('seo-info')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 border border-gray-200"
                    >
                      <Anchor className="h-4 w-4 mr-2" />
                      SEO
                    </a>
                    <a
                      href="#media-info"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('media-info')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 border border-gray-200"
                    >
                      <Anchor className="h-4 w-4 mr-2" />
                      Mídia
                    </a>
                  </nav>
                </div>

                {/* Form Sections */}
                <div className="flex-1 space-y-8">

              {/* Basic Information Section */}
              <div id="basic-info" className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Iniciais</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Produto *
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        aria-required="true"
                      />
                    </div>

                    <div>
                      <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria *
                      </label>
                      <select
                        id="category_id"
                        value={formData.category_id}
                        onChange={(e) => {
                          const categoryId = e.target.value;
                          setFormData(prev => ({ 
                            ...prev, 
                            category_id: categoryId,
                            subcategory_id: undefined // Limpa subcategoria ao mudar categoria
                          }));
                          if (categoryId) {
                            fetchSubcategories(categoryId);
                          } else {
                            setSubcategories([]);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        aria-required="true"
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="subcategory_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Subcategoria
                      </label>
                      <select
                        id="subcategory_id"
                        value={formData.subcategory_id || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, subcategory_id: e.target.value || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!formData.category_id || subcategories.length === 0}
                      >
                        <option value="">
                          {formData.category_id 
                            ? (subcategories.length > 0 ? 'Selecione uma subcategoria' : 'Nenhuma subcategoria disponível')
                            : 'Selecione uma categoria primeiro'
                          }
                        </option>
                        {subcategories.map(subcategory => (
                          <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                        Marca
                      </label>
                      <select
                        id="brand"
                        value={formData.brand || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione uma marca</option>
                        {brands.map(brand => (
                          <option key={brand.id} value={brand.name}>{brand.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div id="additional-info" className="bg-white p-6 rounded-lg border border-gray-200 relative">
                {/* Loading overlay for AI generation */}
                {isGeneratingAI && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex items-center justify-center z-10">
                    <div className="flex items-center space-x-3">
                      <LoadingSpinner size="lg" color="red" />
                      <div>
                        <p className="text-gray-900 font-medium">{aiGenerationMessage}</p>
                        <p className="text-sm text-gray-500 mt-1">Por favor, aguarde...</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Informações Adicionais</h3>
                  <button
                    type="button"
                    onClick={generateContentByAI}
                    disabled={isGeneratingAI}
                    className={`inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                      isGeneratingAI 
                        ? 'bg-purple-400 cursor-not-allowed' 
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar por IA
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="specifications_html" className="block text-sm font-medium text-gray-700 mb-1">
                      Especificações Técnicas
                    </label>
                    <textarea
                      id="specifications_html"
                      value={formData.specifications_html || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, specifications_html: e.target.value || undefined }))}
                      rows={4}
                      placeholder="Digite as especificações técnicas do produto..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Section */}
              <div id="seo-info" className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações de SEO</h3>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="seo_title" className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      id="seo_title"
                      value={formData.seo_title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value || undefined }))}
                      placeholder="Título para SEO (máx. 255 caracteres)"
                      maxLength={255}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.seo_title?.length || 0}/255 caracteres</p>
                  </div>

                  <div>
                    <label htmlFor="seo_description" className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      id="seo_description"
                      value={formData.seo_description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value || undefined }))}
                      placeholder="Descrição para SEO (máx. 500 caracteres)"
                      maxLength={500}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.seo_description?.length || 0}/500 caracteres</p>
                  </div>

                  <div>
                    <label htmlFor="seo_keywords" className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Tags
                    </label>
                    <textarea
                      id="seo_keywords"
                      value={formData.seo_keywords || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_keywords: e.target.value || undefined }))}
                      placeholder="Palavras-chave separadas por vírgula (máx. 500 caracteres)"
                      maxLength={500}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.seo_keywords?.length || 0}/500 caracteres</p>
                  </div>
                </div>
              </div>

              {/* Media Section */}
              <div id="media-info" className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Mídia</h3>
                
                <UnifiedImageUpload
                  images={unifiedImages}
                  onImagesChange={(newImages) => {
                    setUnifiedImages(newImages);
                    syncUnifiedImagesToFormData(newImages);
                  }}
                  maxImages={6}
                  maxSizeInMB={10}
                />
              </div>

                  {/* Product Status - Inline */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={formData.featured}
                          onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-1.5"
                        />
                        <span className="text-gray-700">Destaque</span>
                      </label>

                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={formData.active}
                          onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-1.5"
                        />
                        <span className="text-gray-700">Ativo</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={formData.featured_in_dropdown || false}
                          onChange={(e) => setFormData(prev => ({ ...prev, featured_in_dropdown: e.target.checked }))}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-1.5"
                        />
                        <span className="text-gray-700">Mostrar no dropdown</span>
                      </label>

                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={formData.featured_on_homepage || false}
                          onChange={(e) => setFormData(prev => ({ ...prev, featured_on_homepage: e.target.checked }))}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-1.5"
                        />
                        <span className="text-gray-700">Mostrar na Home</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingProduct ? 'Atualizar' : 'Criar'} Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="relative mx-auto p-5 border w-full max-w-md bg-white rounded-lg shadow-lg my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 id="delete-title" className="text-xl font-bold text-gray-900">
                Confirmar Exclusão
              </h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                aria-label="Fechar"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700">
                Tem certeza que deseja excluir o produto <strong>{productToDelete?.name}</strong>?
              </p>
              <p className="text-sm text-gray-500">
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" role="dialog" aria-modal="true" aria-labelledby="bulk-delete-title">
          <div className="relative mx-auto p-5 border w-full max-w-md bg-white rounded-lg shadow-lg my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 id="bulk-delete-title" className="text-xl font-bold text-gray-900">
                Confirmar Exclusão em Massa
              </h2>
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                aria-label="Fechar"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700">
                Tem certeza que deseja excluir <strong>{selectedProducts.length} produtos</strong>?
              </p>
              <p className="text-sm text-gray-500">
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Excluir Todos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;