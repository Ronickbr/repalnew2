import React, { useEffect, useState, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Users, Package, TrendingUp, Search, Filter, X, Save, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Settings, LogOut, Menu, BarChart3, Image, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Category, Lead } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import MultipleImageUpload from '../components/MultipleImageUpload';
import WysiwygEditor from '../components/WysiwygEditor';
import { useBanners, type Banner, type CreateBannerData } from '../hooks/useBanners';
import BackupSection from '../components/backup/BackupSection';

interface AdminStats {
  totalProducts: number;
  totalCategories: number;
  totalLeads: number;
  recentLeads: number;
}

interface ProductForm {
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
}

interface ProductImageForm {
  id?: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
}

interface CategoryForm {
  id?: string;
  name: string;
  description: string;
  slug: string;
  parent_id?: string;
  is_parent: boolean;
}

interface SiteSettings {
  id?: number;
  site_name: string;
  site_description: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  contact_email: string;
  contact_phone: string;
  address: string;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

const Admin: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    banners, 
    error: bannerError,
    fetchBanners, 
    createBanner, 
    updateBanner, 
    deleteBanner, 
    toggleBannerStatus
  } = useBanners();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'leads' | 'banners' | 'backup' | 'settings'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalLeads: 0,
    recentLeads: 0
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Category[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  
  // Form states
  const [productForm, setProductForm] = useState<ProductForm>({
    product_name: '',
    description: '',
    category_id: '',
    subcategory_id: '',
    active: true,
    featured_in_dropdown: false,
    featured_on_homepage: false,
    clearance_sale: false,
    images: [],
    slug: ''
  });
  
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    name: '',
    description: '',
    slug: '',
    parent_id: '',
    is_parent: false
  });
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_name: '',
    site_description: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    contact_email: '',
    contact_phone: '',
    address: ''
  });
  
  const [settingsForm, setSettingsForm] = useState<SiteSettings>({
    site_name: '',
    site_description: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    contact_email: '',
    contact_phone: '',
    address: ''
  });
  
  const [bannerForm, setBannerForm] = useState<CreateBannerData>({
    title: '',
    image_url: '',
    link_url: '',
    active: true,
    sort_order: 1
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Notification state
  const [notification, setNotification] = useState<Notification | null>(null);
  
  // Loading states for forms
  const [formLoading, setFormLoading] = useState(false);
  
  // Ref to store active timeouts for cleanup
  const activeTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());
  
  // Image upload state removed - no longer needed

  useEffect(() => {
    fetchData();
    fetchSiteSettings();
    fetchBanners();
  }, []);

  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return () => {
      activeTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
      activeTimeouts.current.clear();
    };
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1);
      
      if (error) {
        // Erro já tratado pelo toast
        // Usar valores padrão em caso de erro
        const defaultSettings = {
          site_name: 'Repal Equipamentos',
          site_description: 'Equipamentos de cozinha industrial e comercial para padarias, restaurantes, bares, açougues e confeitarias. Produtos robustos, eficientes e duráveis para aumentar a produtividade do seu negócio.',
          meta_title: 'Repal Equipamentos - Equipamentos de Cozinha Industrial | Padarias, Bares e Restaurantes',
          meta_description: 'Equipamentos de cozinha industrial e comercial para padarias, restaurantes, bares, açougues e confeitarias. Produtos robustos, eficientes e duráveis para aumentar a produtividade do seu negócio.',
          meta_keywords: 'cozinha industrial, equipamentos de cozinha industrial, equipamentos de cozinha profissional, cozinha comercial, equipamentos para cozinha comercial, máquinas para cozinha industrial, utilidades para cozinha profissional, equipamentos de gastronomia',
          contact_email: 'vendas@repalequipamentos.com.br',
          contact_phone: '(41) 3333-3692',
          address: 'Av. Mal. Floriano Peixoto, 1780 - Rebouças, Curitiba - PR, 80230-110'
        };
        setSiteSettings(defaultSettings);
        setSettingsForm(defaultSettings);
        return;
      }
      
      if (data && data.length > 0) {
        setSiteSettings(data[0]);
        setSettingsForm(data[0]);
      } else {
        // Se não há dados, criar configurações padrão
        await createDefaultSettings();
      }
    } catch {
      // Erro já tratado pelo toast
      // Usar valores padrão em caso de erro
      const defaultSettings = {
        site_name: 'Repal Equipamentos',
        site_description: 'Equipamentos de cozinha industrial e comercial para padarias, restaurantes, bares, açougues e confeitarias. Produtos robustos, eficientes e duráveis para aumentar a produtividade do seu negócio.',
        meta_title: 'Repal Equipamentos - Equipamentos de Cozinha Industrial | Padarias, Bares e Restaurantes',
        meta_description: 'Equipamentos de cozinha industrial e comercial para padarias, restaurantes, bares, açougues e confeitarias. Produtos robustos, eficientes e duráveis para aumentar a produtividade do seu negócio.',
        meta_keywords: 'cozinha industrial, equipamentos de cozinha industrial, equipamentos de cozinha profissional, cozinha comercial, equipamentos para cozinha comercial, máquinas para cozinha industrial, utilidades para cozinha profissional, equipamentos de gastronomia',
        contact_email: 'vendas@repalequipamentos.com.br',
        contact_phone: '(41) 3333-3692',
        address: 'Av. Mal. Floriano Peixoto, 1780 - Rebouças, Curitiba - PR, 80230-110'
      };
      setSiteSettings(defaultSettings);
      setSettingsForm(defaultSettings);
    }
  };

  const createDefaultSettings = async () => {
    try {
      const defaultSettings = {
        site_name: 'Repal Equipamentos',
        site_description: 'Equipamentos de cozinha industrial e comercial para padarias, restaurantes, bares, açougues e confeitarias. Produtos robustos, eficientes e duráveis para aumentar a produtividade do seu negócio.',
        meta_title: 'Repal Equipamentos - Equipamentos de Cozinha Industrial | Padarias, Bares e Restaurantes',
        meta_description: 'Equipamentos de cozinha industrial e comercial para padarias, restaurantes, bares, açougues e confeitarias. Produtos robustos, eficientes e duráveis para aumentar a produtividade do seu negócio.',
        meta_keywords: 'cozinha industrial, equipamentos de cozinha industrial, equipamentos de cozinha profissional, cozinha comercial, equipamentos para cozinha comercial, máquinas para cozinha industrial, utilidades para cozinha profissional, equipamentos de gastronomia',
        contact_email: 'vendas@repalequipamentos.com.br',
        contact_phone: '(41) 3333-3692',
        address: 'Av. Mal. Floriano Peixoto, 1780 - Rebouças, Curitiba - PR, 80230-110'
      };

      const { data, error } = await supabase
        .from('site_settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (error) {
        // Erro já tratado pelo toast
        // Usar valores padrão mesmo se não conseguir inserir
        setSiteSettings(defaultSettings);
        setSettingsForm(defaultSettings);
      } else {
        setSiteSettings(data);
        setSettingsForm(data);
      }
    } catch {
      // Erro já tratado pelo toast
      // Usar valores padrão em caso de erro
      const defaultSettings = {
        site_name: 'Repal Equipamentos',
        site_description: 'Equipamentos de cozinha industrial e comercial para padarias, restaurantes, bares, açougues e confeitarias. Produtos robustos, eficientes e duráveis para aumentar a produtividade do seu negócio.',
        meta_title: 'Repal Equipamentos - Equipamentos de Cozinha Industrial | Padarias, Bares e Restaurantes',
        meta_description: 'Equipamentos de cozinha industrial e comercial para padarias, restaurantes, bares, açougues e confeitarias. Produtos robustos, eficientes e duráveis para aumentar a produtividade do seu negócio.',
        meta_keywords: 'cozinha industrial, equipamentos de cozinha industrial, equipamentos de cozinha profissional, cozinha comercial, equipamentos para cozinha comercial, máquinas para cozinha industrial, utilidades para cozinha profissional, equipamentos de gastronomia',
        contact_email: 'vendas@repalequipamentos.com.br',
        contact_phone: '(41) 3333-3692',
        address: 'Av. Mal. Floriano Peixoto, 1780 - Rebouças, Curitiba - PR, 80230-110'
      };
      setSiteSettings(defaultSettings);
      setSettingsForm(defaultSettings);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch stats with individual error handling
      const statsPromises = [
        supabase.from('products').select('id', { count: 'exact', head: true }).then(res => ({ type: 'products', ...res })),
        supabase.from('categories').select('id', { count: 'exact', head: true }).then(res => ({ type: 'categories', ...res })),
        supabase.from('leads').select('id', { count: 'exact', head: true }).then(res => ({ type: 'leads', ...res })),
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .then(res => ({ type: 'recentLeads', ...res }))
      ];

      const statsResults = await Promise.allSettled(statsPromises);
      
      const newStats = { totalProducts: 0, totalCategories: 0, totalLeads: 0, recentLeads: 0 };
      
      statsResults.forEach((result) => {
        if (result.status === 'fulfilled' && !result.value.error) {
          const { type, count } = result.value;
          switch (type) {
            case 'products':
              newStats.totalProducts = count || 0;
              break;
            case 'categories':
              newStats.totalCategories = count || 0;
              break;
            case 'leads':
              newStats.totalLeads = count || 0;
              break;
            case 'recentLeads':
              newStats.recentLeads = count || 0;
              break;
          }
        } else {
          // Erro já tratado pelo estado
        }
      });
      
      setStats(newStats);

      // Fetch detailed data with individual error handling
      const dataPromises = [
        supabase.from('products').select(`
          *,
          category:categories!products_category_id_fkey(name),
          subcategory:categories!products_subcategory_id_fkey(name)
        `).order('created_at', { ascending: false }).then(res => ({ type: 'products', ...res })),
        supabase.from('categories').select('*').order('name').then(res => ({ type: 'categories', ...res })),
        supabase.from('leads').select('*').order('created_at', { ascending: false }).then(res => ({ type: 'leads', ...res }))
      ];

      const dataResults = await Promise.allSettled(dataPromises);
      
      dataResults.forEach((result) => {
        if (result.status === 'fulfilled' && !result.value.error && result.value.data) {
          const { type, data } = result.value;
          switch (type) {
            case 'products':
              setProducts(data);
              break;
            case 'categories':
              setCategories(data);
              // Separar categorias pai e subcategorias
              const parents = data.filter((cat: Category) => cat.is_parent === true);
        const subs = data.filter((cat: Category) => cat.is_parent === false);
              setParentCategories(parents);
              setSubcategories(subs);
              break;
            case 'leads':
              setLeads(data);
              break;
          }
        } else {
          // Erro já tratado pelo estado
          
          // Set fallback data for failed requests
          if (result.status === 'fulfilled') {
            const { type } = result.value;
            switch (type) {
              case 'products':
                setProducts([]);
                break;
              case 'categories':
                setCategories([]);
                break;
              case 'leads':
                setLeads([]);
                break;
            }
          }
        }
      });
      
    } catch {
      // Erro já tratado pelo estado
      setError('Erro ao conectar com o banco de dados. Verifique sua conexão.');
      
      // Set fallback data
      setStats({ totalProducts: 0, totalCategories: 0, totalLeads: 0, recentLeads: 0 });
      setProducts([]);
      setCategories([]);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    const timeoutId = setTimeout(() => {
      setNotification(null);
      activeTimeouts.current.delete(timeoutId);
    }, 5000);
    
    // Store timeout ID for cleanup
    activeTimeouts.current.add(timeoutId);
  };

  // Função utilitária para tratamento consistente de erros
  const handleError = (error: unknown, context: string, fallbackMessage?: string) => {
    // Erro já tratado pelo toast
    
    let errorMessage = fallbackMessage || 'Erro desconhecido';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = String((error as { message: unknown }).message);
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    showNotification('error', `${context}: ${errorMessage}`);
    return errorMessage;
  };

  // Função para filtrar subcategorias baseadas na categoria pai selecionada
  const filterSubcategories = (parentCategoryId: string) => {
    if (!parentCategoryId) {
      setFilteredSubcategories([]);
      return;
    }
    const filtered = subcategories.filter(sub => sub.parent_id?.toString() === parentCategoryId);
    setFilteredSubcategories(filtered);
  };

  // Função para lidar com mudança de categoria pai no formulário de produto
  const handleParentCategoryChange = (parentCategoryId: string) => {
    setProductForm({ 
      ...productForm, 
      category_id: parentCategoryId,
      subcategory_id: '' // Reset subcategoria quando categoria pai muda
    });
    filterSubcategories(parentCategoryId);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const validateProductForm = () => {
    if (!productForm.product_name.trim()) {
      showNotification('error', 'Nome do produto é obrigatório');
      return false;
    }
    if (!productForm.description.trim()) {
      showNotification('error', 'Descrição é obrigatória');
      return false;
    }
    if (!productForm.category_id) {
      showNotification('error', 'Categoria pai é obrigatória');
      return false;
    }
    if (!productForm.subcategory_id) {
      showNotification('error', 'Subcategoria é obrigatória');
      return false;
    }

    return true;
  };

  const validateCategoryForm = () => {
    if (!categoryForm.name.trim()) {
      showNotification('error', 'Nome da categoria é obrigatório');
      return false;
    }
    if (!categoryForm.description.trim()) {
      showNotification('error', 'Descrição é obrigatória');
      return false;
    }
    return true;
  };

  const validateSettingsForm = () => {
    if (!settingsForm.site_name.trim()) {
      showNotification('error', 'Nome do site é obrigatório');
      return false;
    }
    if (!settingsForm.site_description.trim()) {
      showNotification('error', 'Descrição do site é obrigatória');
      return false;
    }
    if (settingsForm.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settingsForm.contact_email)) {
      showNotification('error', 'Email de contato inválido');
      return false;
    }
    return true;
  };

  const resetProductForm = () => {
    setProductForm({
      product_name: '',
      description: '',
      category_id: '',
      subcategory_id: '',
      active: true,
      featured_in_dropdown: false,
      featured_on_homepage: false,
      clearance_sale: false,
      images: [],
      slug: ''
    });
    setFilteredSubcategories([]);
    setEditingProduct(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      id: undefined,
      name: '',
      description: '',
      slug: '',
      parent_id: '',
      is_parent: false
    });
    setEditingCategory(null);
  };

  const resetSettingsForm = () => {
    setSettingsForm({
      site_name: siteSettings.site_name,
      site_description: siteSettings.site_description,
      meta_title: siteSettings.meta_title,
      meta_description: siteSettings.meta_description,
      meta_keywords: siteSettings.meta_keywords,
      contact_email: siteSettings.contact_email,
      contact_phone: siteSettings.contact_phone,
      address: siteSettings.address
    });
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        // Erro já tratado pelo toast
        alert(`Erro ao excluir produto: ${error.message || 'Erro desconhecido'}`);
        return;
      }
      
      setProducts(products.filter(p => p.id.toString() !== id));
      alert('Produto excluído com sucesso!');
    } catch {
      // Erro já tratado pelo toast
      alert('Erro de conexão ao excluir produto. Verifique sua internet.');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        // Erro já tratado pelo toast
        alert(`Erro ao excluir categoria: ${error.message || 'Erro desconhecido'}`);
        return;
      }
      
      setCategories(categories.filter(c => c.id.toString() !== id));
      alert('Categoria excluída com sucesso!');
    } catch {
      // Erro já tratado pelo toast
      alert('Erro de conexão ao excluir categoria. Verifique sua internet.');
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) {
        // Erro já tratado pelo toast
        alert(`Erro ao excluir lead: ${error.message || 'Erro desconhecido'}`);
        return;
      }
      
      setLeads(leads.filter(l => l.id !== id));
      alert('Lead excluído com sucesso!');
    } catch {
      // Erro já tratado pelo toast
      alert('Erro de conexão ao excluir lead. Verifique sua internet.');
    }
  };

  // Save functions
  const saveProduct = async () => {
    if (!validateProductForm()) return;
    
    setFormLoading(true);
    try {
      const slug = generateSlug(productForm.product_name);
      
      // Preparar dados do produto
      const productData = {
        product_name: productForm.product_name,
        description: productForm.description,
        category_id: productForm.category_id,
        subcategory_id: productForm.subcategory_id,
        active: productForm.active,
        featured_in_dropdown: productForm.featured_in_dropdown,
        featured_on_homepage: productForm.featured_on_homepage,
        clearance_sale: productForm.clearance_sale,
        image_url: productForm.images.find(img => img.is_primary)?.image_url || productForm.images[0]?.image_url || null,
        slug
      };
      
      let productId: string | number;
      
      if (editingProduct) {
        // Atualizar produto existente
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        
        if (error) {
          // Erro já tratado pelo toast
          throw error;
        }
        productId = editingProduct.id.toString();
        
        // Remover imagens existentes
        const { error: deleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId);
        if (deleteError) {
          // Erro já tratado pelo toast
        }
        
        showNotification('success', 'Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        
        if (error) {
          // Erro já tratado pelo toast
          throw error;
        }
        productId = data.id;
        showNotification('success', 'Produto criado com sucesso!');
      }
      
      // Salvar imagens na tabela product_images
      if (productForm.images.length > 0) {
        const imageData = productForm.images.map((image, index) => ({
          product_id: productId,
          image_url: image.image_url,
          alt_text: image.alt_text || productForm.product_name,
          sort_order: image.sort_order || index,
          is_primary: image.is_primary || index === 0
        }));

        const { error: imageError } = await supabase
          .from('product_images')
          .insert(imageData);
        if (imageError) {
          // Erro já tratado pelo toast
          throw imageError;
        }
      }
      
      setShowProductModal(false);
      resetProductForm();
      fetchData();
    } catch (error) {
      handleError(error, 'Erro ao salvar produto');
    } finally {
      setFormLoading(false);
    }
  };

  const saveCategory = async () => {
    if (!validateCategoryForm()) return;
    
    setFormLoading(true);
    try {
      const slug = generateSlug(categoryForm.name);
      const { id, ...categoryDataWithoutId } = categoryForm;
      const categoryData = {
        ...categoryDataWithoutId,
        slug
      };
      
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        showNotification('success', 'Categoria atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);
        
        if (error) throw error;
        showNotification('success', 'Categoria criada com sucesso!');
      }
      
      setShowCategoryModal(false);
      resetCategoryForm();
      fetchData();
    } catch (error) {
      handleError(error, 'Erro ao salvar categoria');
    } finally {
      setFormLoading(false);
    }
  };

  const saveSiteSettings = async () => {
    if (!validateSettingsForm()) {
      return;
    }
    
    setFormLoading(true);
    try {
      // Preparar dados para salvar (remover campos de timestamp se existirem)
      const { id, ...settingsDataToSave } = settingsForm;
      
      // Verificar se existe algum registro na tabela (sem .single() para evitar erro)
      const { data: existingData } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1);
      
      let result;
      
      if (existingData && existingData.length > 0) {
        // Atualizar registro existente
        const existingId = existingData[0].id;
        
        result = await supabase
          .from('site_settings')
          .update({
            ...settingsDataToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingId)
          .select();
          
        // Pegar apenas o primeiro resultado para evitar erro de coerção
        if (result.data && result.data.length > 0) {
          result.data = result.data[0];
        }
      } else {
        // Inserir novo registro
        
        result = await supabase
          .from('site_settings')
          .insert([{
            ...settingsDataToSave,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();
          
        // Pegar apenas o primeiro resultado para evitar erro de coerção
        if (result.data && result.data.length > 0) {
          result.data = result.data[0];
        }
      }
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.data) {
        setSiteSettings(result.data as unknown as SiteSettings);
        setSettingsForm(result.data as unknown as SiteSettings);
        showNotification('success', 'Configurações salvas com sucesso!');
        
        // Fechar o modal após salvar com sucesso
        setShowSettingsModal(false);
      } else {
        throw new Error('Nenhum dado retornado após salvamento');
      }
      
    } catch (error) {
      handleError(error, 'Erro ao salvar configurações');
    } finally {
      setFormLoading(false);
    }
  };

  // Modal handlers
  const openProductModal = async (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      
      // Carregar imagens do produto
      let productImages: ProductImageForm[] = [];
      try {
        const { data: images, error } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', product.id)
          .order('sort_order');
        
        if (error) {
          // Erro já tratado pelo estado
        } else if (images && images.length > 0) {
          productImages = images.map(img => ({
            id: img.id,
            image_url: img.image_url,
            alt_text: img.alt_text,
            sort_order: img.sort_order,
            is_primary: img.is_primary
          }));
        } else if (product.image_url) {
          // Fallback para produtos com image_url na tabela products
          productImages = [{
            image_url: product.image_url,
            alt_text: product.product_name,
            sort_order: 0,
            is_primary: true
          }];
        }
      } catch {
        // Erro já tratado pelo estado
        if (product.image_url) {
          productImages = [{
            image_url: product.image_url,
            alt_text: product.product_name,
            sort_order: 0,
            is_primary: true
          }];
        }
      }
      
      setProductForm({
        id: product.id.toString(),
        product_name: product.product_name,
        description: product.description || '',
        category_id: product.category_id?.toString() || '',
        subcategory_id: product.subcategory_id?.toString() || '',
        active: product.active,
        featured_in_dropdown: product.featured_in_dropdown || false,
        featured_on_homepage: product.featured_on_homepage || false,
        clearance_sale: product.clearance_sale || false,
        images: productImages,
        slug: product.slug
      });
      
      // Filtrar subcategorias quando editar produto
      if (product.category_id) {
        filterSubcategories(product.category_id.toString());
      }
    } else {
      resetProductForm();
    }
    setShowProductModal(true);
  };

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        id: category.id.toString(),
        name: category.name,
        description: category.description || '',
        slug: category.slug,
        parent_id: category.parent_id?.toString() || '',
        is_parent: category.is_parent || false
      });
    } else {
      resetCategoryForm();
    }
    setShowCategoryModal(true);
  };

  const openLeadModal = (lead: Lead) => {
    setViewingLead(lead);
    setShowLeadModal(true);
  };

  // Image upload function removed - no longer needed

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id?.toString() === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || product.subcategory_id?.toString() === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const filteredLeads = leads.filter(lead =>
    lead.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.product_name && lead.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination functions
  const getPaginatedData = <T,>(data: T[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = (totalPages: number) => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Filter subcategories based on selected category
  useEffect(() => {
    if (selectedCategory) {
      const filtered = subcategories.filter(sub => sub.parent_id?.toString() === selectedCategory);
      setFilteredSubcategories(filtered);
    } else {
      setFilteredSubcategories([]);
    }
    // Reset subcategory selection when category changes
    setSelectedSubcategory('');
  }, [selectedCategory, subcategories]);

  // Reset pagination when changing tabs or filters
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, selectedCategory, selectedSubcategory]);

  // Get paginated data
  const paginatedProducts = getPaginatedData(filteredProducts);
  const paginatedCategories = getPaginatedData(categories);
  const paginatedLeads = getPaginatedData(filteredLeads);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Erro de Conexão!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            onClick={fetchData}
            className="bg-red-900 hover:bg-red-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {notification.type === 'info' && <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center h-16 px-4 bg-red-900">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        </div>
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                activeTab === 'dashboard'
                  ? 'bg-red-100 text-red-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('products'); setSidebarOpen(false); }}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                activeTab === 'products'
                  ? 'bg-red-100 text-red-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Package className="mr-3 h-5 w-5" />
              Produtos
            </button>
            <button
              onClick={() => { setActiveTab('categories'); setSidebarOpen(false); }}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                activeTab === 'categories'
                  ? 'bg-red-100 text-red-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Filter className="mr-3 h-5 w-5" />
              Categorias
            </button>
            <button
              onClick={() => { setActiveTab('leads'); setSidebarOpen(false); }}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                activeTab === 'leads'
                  ? 'bg-red-100 text-red-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Users className="mr-3 h-5 w-5" />
              Leads
            </button>
            <button
              onClick={() => { setActiveTab('banners'); setSidebarOpen(false); }}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                activeTab === 'banners'
                  ? 'bg-red-100 text-red-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Image className="mr-3 h-5 w-5" />
              Banners
            </button>
            <button
              onClick={() => { setActiveTab('backup'); setSidebarOpen(false); }}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                activeTab === 'backup'
                  ? 'bg-red-100 text-red-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Database className="mr-3 h-5 w-5" />
              Backup
            </button>
            <button
              onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                activeTab === 'settings'
                  ? 'bg-red-100 text-red-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Settings className="mr-3 h-5 w-5" />
              Configurações
            </button>
          </div>
        </nav>
      </div>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="ml-2 lg:ml-0 text-2xl font-bold text-gray-900">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'products' && 'Produtos'}
                  {activeTab === 'categories' && 'Categorias'}
                  {activeTab === 'leads' && 'Leads'}
                  {activeTab === 'banners' && 'Banners'}
                  {activeTab === 'backup' && 'Backup'}
                  {activeTab === 'settings' && 'Configurações'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Bem-vindo, {user?.name || 'Admin'}</span>
                <button
                  onClick={logout}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total de Produtos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Filter className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Categorias</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total de Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Leads (7 dias)</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recentLeads}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Leads */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Leads Recentes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Origem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.slice(0, 5).map((lead) => (
                      <tr key={lead.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{lead.client_name}</div>
                            <div className="text-sm text-gray-500">{lead.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.product_name || 'Não especificado'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {lead.source}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Backup Tab */}
        {activeTab === 'backup' && (
          <BackupSection />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Configurações do Site</h2>
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <Settings className="h-5 w-5" />
                <span>Editar Configurações</span>
              </button>
            </div>
            
            {/* Current Settings Display */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Configurações Atuais</h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Informações Gerais */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Informações Gerais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Site</label>
                      <p className="text-gray-900">{siteSettings.site_name || 'Não configurado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                      <p className="text-gray-900">{siteSettings.site_description || 'Não configurado'}</p>
                    </div>
                  </div>
                </div>

                {/* SEO */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">SEO</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                      <p className="text-gray-900">{siteSettings.meta_title || 'Não configurado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                      <p className="text-gray-900">{siteSettings.meta_description || 'Não configurado'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                      <p className="text-gray-900">{siteSettings.meta_keywords || 'Não configurado'}</p>
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Contato</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contato</label>
                      <p className="text-gray-900">{siteSettings.contact_email || 'Não configurado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                      <p className="text-gray-900">{siteSettings.contact_phone || 'Não configurado'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                      <p className="text-gray-900">{siteSettings.address || 'Não configurado'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
              <button 
                onClick={() => openProductModal()}
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
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
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
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
                    {paginatedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4 w-2/6 min-w-[250px]">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full object-cover" src={(product.image_url || '/placeholder.jpg')} alt={product.product_name} />
                            </div>
                            <div className="ml-4 min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate" title={product.product_name}>
                                {product.product_name}
                              </div>
                              <div className="text-sm text-gray-500 truncate" title={product.description || 'Sem descrição'}>
                                {product.description ? product.description.substring(0, 50) + '...' : 'Sem descrição'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 w-1/6 min-w-[100px]">
                          <div className="text-sm text-gray-900 truncate" title={product.category?.name || 'Sem categoria'}>
                            {product.category?.name || 'Sem categoria'}
                          </div>
                        </td>
                        <td className="px-3 py-4 w-1/6 min-w-[100px]">
                          <div className="text-sm text-gray-900 truncate" title={product.subcategory?.name || 'Sem subcategoria'}>
                            {product.subcategory?.name || 'Sem subcategoria'}
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
                              onClick={() => openProductModal(product)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 flex-shrink-0"
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => openProductModal(product)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 flex-shrink-0"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteProduct(product.id.toString())}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 flex-shrink-0"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {Array.from({ length: getTotalPages(filteredProducts.length) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
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
                      onClick={() => goToNextPage(getTotalPages(filteredProducts.length))}
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
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Categorias</h2>
              <button 
                onClick={() => openCategoryModal()}
                className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Nova Categoria</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCategories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openCategoryModal(category)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => openCategoryModal(category)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => deleteCategory(category.id.toString())}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                  <div className="text-xs text-gray-500">
                    Slug: {category.slug}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination for Categories */}
            {categories.length > itemsPerPage && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, categories.length)} de {categories.length} categorias
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: getTotalPages(categories.length) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
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
                    onClick={() => goToNextPage(getTotalPages(categories.length))}
                    disabled={currentPage === getTotalPages(categories.length)}
                    className="p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Leads</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Origem
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.client_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.email}</div>
                        <div className="text-sm text-gray-500">{lead.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.product_name || 'Não especificado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => openLeadModal(lead)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteLead(lead.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination for Leads */}
              {filteredLeads.length > itemsPerPage && (
                <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredLeads.length)} de {filteredLeads.length} leads
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {Array.from({ length: getTotalPages(filteredLeads.length) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
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
                      onClick={() => goToNextPage(getTotalPages(filteredLeads.length))}
                      disabled={currentPage === getTotalPages(filteredLeads.length)}
                      className="p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Banners Tab */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Banners</h2>
              <button
                onClick={() => {
                  setEditingBanner(null);
                  setBannerForm({
                    title: '',
                    image_url: '',
                    link_url: '',
                    active: true,
                    sort_order: banners.length + 1
                  });
                  setShowBannerModal(true);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Banner
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Imagem
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Link
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ordem
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Carregando banners...
                      </td>
                    </tr>
                  ) : banners.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Nenhum banner encontrado
                      </td>
                    </tr>
                  ) : (
                    banners.map((banner) => (
                      <tr key={banner.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-20 h-12 bg-gray-200 rounded overflow-hidden">
                            {banner.image_url ? (
                              <img
                                src={banner.image_url}
                                alt={banner.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{banner.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {banner.link_url || 'Sem link'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            banner.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {banner.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {banner.sort_order}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingBanner(banner);
                                setBannerForm({
                                  title: banner.title,
                                  image_url: banner.image_url,
                                  link_url: banner.link_url,
                                  active: banner.active,
                                  sort_order: banner.sort_order
                                });
                                setShowBannerModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => toggleBannerStatus(banner.id, !banner.active)}
                              className={`p-1 rounded ${
                                banner.active
                                  ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                  : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                              }`}
                              title={banner.active ? 'Desativar' : 'Ativar'}
                            >
                              {banner.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => deleteBanner(banner.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    resetProductForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); saveProduct(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={productForm.product_name}
                      onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria Principal *
                    </label>
                    <select
                      value={productForm.category_id}
                      onChange={(e) => handleParentCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione uma categoria principal</option>
                      {parentCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subcategoria - só aparece quando categoria pai é selecionada */}
                {productForm.category_id && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subcategoria *
                      </label>
                      <select
                        value={productForm.subcategory_id}
                        onChange={(e) => setProductForm({ ...productForm, subcategory_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Selecione uma subcategoria</option>
                        {filteredSubcategories.map((subcategory) => (
                          <option key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição *
                    </label>
                    <WysiwygEditor
                      value={productForm.description}
                      onChange={(value) => setProductForm({ ...productForm, description: value })}
                      placeholder="Digite a descrição do produto..."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
                    <strong>Preços:</strong> Entre em contato para consultar preços dos produtos.
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Imagens do Produto (máximo 5)
                    </label>
                    <MultipleImageUpload
                      images={productForm.images.map(img => img.image_url)}
                      onImagesChange={(imageUrls: string[]) => {
                        const newImages: ProductImageForm[] = imageUrls.map((url, index) => {
                          const existingImage = productForm.images.find(img => img.image_url === url);
                          return {
                            id: existingImage?.id,
                            image_url: url,
                            alt_text: existingImage?.alt_text || productForm.product_name,
                            sort_order: index,
                            is_primary: index === 0
                          };
                        });
                        setProductForm({ ...productForm, images: newImages });
                      }}
                      maxImages={5}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Checkbox principal - Produto Ativo */}
                  <div className="border-b pb-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={productForm.active}
                        onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Produto Ativo</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">Quando desmarcado, o produto será considerado desativado</p>
                  </div>

                  {/* Opções de destaque */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Opções de Destaque:</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productForm.featured_in_dropdown}
                          onChange={(e) => setProductForm({ ...productForm, featured_in_dropdown: e.target.checked })}
                          className="mr-2"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700">Produto em destaque no dropdown</span>
                          <span className="text-xs text-gray-500">Exibe o produto no menu dropdown</span>
                        </div>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productForm.featured_on_homepage}
                          onChange={(e) => setProductForm({ ...productForm, featured_on_homepage: e.target.checked })}
                          className="mr-2"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700">Produto em destaque na página Home</span>
                          <span className="text-xs text-gray-500">Exibe o produto na página inicial</span>
                        </div>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productForm.clearance_sale}
                          onChange={(e) => setProductForm({ ...productForm, clearance_sale: e.target.checked })}
                          className="mr-2"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700">Produto em Queima de Estoque</span>
                          <span className="text-xs text-gray-500">Exibe o produto na seção de queima de estoque</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(null);
                      resetProductForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {formLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h2>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); saveCategory(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCategoryForm({ 
                        ...categoryForm, 
                        name,
                        slug: generateSlug(name)
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryModal(false);
                      setEditingCategory(null);
                      resetCategoryForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {formLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Configurações do Site
                </h2>
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    resetSettingsForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); saveSiteSettings(); }} className="space-y-6">
                {/* Informações Gerais */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações Gerais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Site *
                      </label>
                      <input
                        type="text"
                        value={settingsForm.site_name}
                        onChange={(e) => setSettingsForm({ ...settingsForm, site_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição do Site
                      </label>
                      <textarea
                        value={settingsForm.site_description}
                        onChange={(e) => setSettingsForm({ ...settingsForm, site_description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* SEO */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">SEO</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={settingsForm.meta_title}
                        onChange={(e) => setSettingsForm({ ...settingsForm, meta_title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Título que aparece na aba do navegador"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Description
                      </label>
                      <textarea
                        value={settingsForm.meta_description}
                        onChange={(e) => setSettingsForm({ ...settingsForm, meta_description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Descrição que aparece nos resultados de busca"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Keywords
                      </label>
                      <input
                        type="text"
                        value={settingsForm.meta_keywords}
                        onChange={(e) => setSettingsForm({ ...settingsForm, meta_keywords: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Palavras-chave separadas por vírgula"
                      />
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email de Contato *
                      </label>
                      <input
                        type="email"
                        value={settingsForm.contact_email}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contact_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone de Contato
                      </label>
                      <input
                        type="tel"
                        value={settingsForm.contact_phone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contact_phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Endereço
                      </label>
                      <textarea
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Endereço completo da empresa"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      resetSettingsForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {formLoading ? 'Salvando...' : 'Salvar Configurações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Banner Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingBanner ? 'Editar Banner' : 'Novo Banner'}
                </h2>
                <button
                  onClick={() => {
                    setShowBannerModal(false);
                    setEditingBanner(null);
                    setBannerForm({
                      title: '',
                      image_url: '',
                      link_url: '',
                      active: true,
                      sort_order: banners.length + 1
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {bannerError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {bannerError}
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                setFormLoading(true);
                try {
                  if (editingBanner) {
                    await updateBanner(editingBanner.id, bannerForm);
                  } else {
                    await createBanner(bannerForm);
                  }
                  setShowBannerModal(false);
                  setEditingBanner(null);
                  setBannerForm({
                    title: '',
                    image_url: '',
                    link_url: '',
                    active: true,
                    sort_order: banners.length + 1
                  });
                } catch (error) {
                  console.error('Erro ao salvar banner:', error);
                  // O erro já é tratado no hook useBanners
                }
                setFormLoading(false);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                    placeholder="Título do banner"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Imagem *
                  </label>
                  <input
                    type="url"
                    value={bannerForm.image_url}
                    onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                  {bannerForm.image_url && (
                    <div className="mt-2">
                      <img
                        src={bannerForm.image_url}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL do Link
                  </label>
                  <input
                    type="url"
                    value={bannerForm.link_url}
                    onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="https://exemplo.com (opcional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordem de Exibição
                    </label>
                    <input
                      type="number"
                      value={bannerForm.sort_order}
                      onChange={(e) => setBannerForm({ ...bannerForm, sort_order: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      min="1"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bannerForm.active}
                        onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                        className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Banner Ativo</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBannerModal(false);
                      setEditingBanner(null);
                      setBannerForm({
                        title: '',
                        image_url: '',
                        link_url: '',
                        active: true,
                        sort_order: banners.length + 1
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {formLoading ? 'Salvando...' : (editingBanner ? 'Atualizar Banner' : 'Criar Banner')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lead Modal */}
      {showLeadModal && viewingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalhes do Lead
                </h2>
                <button
                  onClick={() => {
                    setShowLeadModal(false);
                    setViewingLead(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <p className="text-gray-900">{viewingLead.client_name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{viewingLead.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <p className="text-gray-900">{viewingLead.phone || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Produto de Interesse
                    </label>
                    <p className="text-gray-900">{viewingLead.product_name || '-'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                    {viewingLead.message || 'Nenhuma mensagem fornecida.'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Criação
                  </label>
                  <p className="text-gray-900">
                    {new Date(viewingLead.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      setShowLeadModal(false);
                      setViewingLead(null);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default Admin;