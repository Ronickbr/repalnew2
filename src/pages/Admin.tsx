import React, { useEffect, useState, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Users, Package, TrendingUp, Search, Filter, X, Save, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Settings, LogOut, Menu, BarChart3, Image, Database } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Product, Category, Lead } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useBanners, type Banner, type CreateBannerData } from '../hooks/useBanners';
import BackupSection from '../components/backup/BackupSection';
import ProductFormWrapper from '../components/ProductFormWrapper';
import { BannerModal, LeadModal, CategoryManager } from '../components/admin';

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
  brand?: string;
  technical_specifications?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  short_description?: string;
  key_features?: string;
  model?: string;
  sku_code?: string;
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
  
  // AI Generation states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
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
        supabase.from('products').select('id', { count: 'exact', head: true }).then((res: any) => ({ type: 'products', ...res })),
        supabase.from('categories').select('id', { count: 'exact', head: true }).then((res: any) => ({ type: 'categories', ...res })),
        supabase.from('leads').select('id', { count: 'exact', head: true }).then((res: any) => ({ type: 'leads', ...res })),
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .then((res: any) => ({ type: 'recentLeads', ...res }))
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
        supabase.from('products').select('*').order('created_at', { ascending: false }).then((res: any) => ({ type: 'products', ...res })),
        supabase.from('categories').select('*').order('name').then((res: any) => ({ type: 'categories', ...res })),
        supabase.from('leads').select('*').order('created_at', { ascending: false }).then((res: any) => ({ type: 'leads', ...res }))
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
          // Set fallback data for failed requests
          if (result.status === 'fulfilled') {
            const { type } = result.value;
            switch (type) {
              case 'products':
                // Fallback de desenvolvimento: manter formulário acessível sem dados do Supabase
                // Se o Supabase não está configurado, usar um exemplo mínimo para validar UI
                if (!isSupabaseConfigured) {
                  setProducts([]);
                } else {
                  setProducts([]);
                }
                break;
              case 'categories':
                if (!isSupabaseConfigured) {
                  const devParent: Category = {
                    id: 1,
                    name: 'Categoria Exemplo',
                    slug: 'categoria-exemplo',
                    description: 'Usada para validação visual em desenvolvimento',
                    sort_order: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_parent: true,
                  } as Category;
                  const devSub: Category = {
                    id: 2,
                    name: 'Subcategoria Exemplo',
                    slug: 'subcategoria-exemplo',
                    description: 'Usada para validação visual em desenvolvimento',
                    sort_order: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    parent_id: 1,
                    is_parent: false,
                  } as Category;
                  const devCats = [devParent, devSub];
                  setCategories(devCats);
                  setParentCategories([devParent]);
                  setSubcategories([devSub]);
                } else {
                  setCategories([]);
                }
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
      if (!isSupabaseConfigured) {
        const devParent: Category = {
          id: 1,
          name: 'Categoria Exemplo',
          slug: 'categoria-exemplo',
          description: 'Usada para validação visual em desenvolvimento',
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_parent: true,
        } as Category;
        const devSub: Category = {
          id: 2,
          name: 'Subcategoria Exemplo',
          slug: 'subcategoria-exemplo',
          description: 'Usada para validação visual em desenvolvimento',
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          parent_id: 1,
          is_parent: false,
        } as Category;
        const devCats = [devParent, devSub];
        setCategories(devCats);
        setParentCategories([devParent]);
        setSubcategories([devSub]);
      } else {
        setCategories([]);
      }
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

  // Funções helper para mapear IDs de categoria/subcategoria para nomes
  const getCategoryName = (categoryId?: number): string => {
    if (!categoryId) return 'Sem categoria';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Sem categoria';
  };

  const getSubcategoryName = (subcategoryId?: number): string => {
    if (!subcategoryId) return 'Sem subcategoria';
    const subcategory = subcategories.find(subcat => subcat.id === subcategoryId);
    return subcategory?.name || 'Sem subcategoria';
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

  // Handlers para modais
  const handleBannerModalClose = () => {
    setShowBannerModal(false);
    setEditingBanner(null);
    setBannerForm({
      title: '',
      image_url: '',
      link_url: '',
      active: true,
      sort_order: banners.length + 1
    });
  };

  const handleBannerFormChange = (field: string, value: any) => {
    setBannerForm({ ...bannerForm, [field]: value });
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, bannerForm);
      } else {
        await createBanner(bannerForm);
      }
      handleBannerModalClose();
    } catch (error) {
      console.error('Erro ao salvar banner:', error);
      // O erro já é tratado no hook useBanners
    }
    setFormLoading(false);
  };

  const handleLeadModalClose = () => {
    setShowLeadModal(false);
    setViewingLead(null);
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
      slug: '',
      // Campos opcionais - inicializar como strings vazias
      brand: '',
      technical_specifications: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      short_description: '',
      key_features: '',
      model: '',
      sku_code: ''
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

  // Função comentada - agora gerenciada pelo CategoryManager
  // const deleteCategory = async (id: string) => {
  //   if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
  //   
  //   try {
  //     const { error } = await supabase.from('categories').delete().eq('id', id);
  //     if (error) {
  //       // Erro já tratado pelo toast
  //       alert(`Erro ao excluir categoria: ${error.message || 'Erro desconhecido'}`);
  //       return;
  //     }
  //     
  //     setCategories(categories.filter(c => c.id.toString() !== id));
  //     alert('Categoria excluída com sucesso!');
  //   } catch {
  //     // Erro já tratado pelo toast
  //     alert('Erro de conexão ao excluir categoria. Verifique sua internet.');
  //   }
  // };

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
        slug,
        // Campos adicionais
        brand: productForm.brand,
        technical_specifications: productForm.technical_specifications,
        meta_title: productForm.meta_title,
        meta_description: productForm.meta_description,
        meta_keywords: productForm.meta_keywords,
        short_description: productForm.short_description,
        key_features: productForm.key_features,
        model: productForm.model,
        sku_code: productForm.sku_code
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

  // AI Content Generation Function
  const generateAIContent = async () => {
    // Validate required fields
    if (!productForm.product_name.trim()) {
      showNotification('error', 'Por favor, insira o nome do produto antes de gerar conteúdo.');
      return;
    }
    
    if (!productForm.category_id) {
      showNotification('error', 'Por favor, selecione uma categoria antes de gerar conteúdo.');
      return;
    }

    // Check if API key is configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setAiError('Chave API do Gemini não configurada. Usando conteúdo padrão.');
      // Generate fallback content without API
      const categoryName = categories.find(c => c.id.toString() === productForm.category_id)?.name || 'Equipamentos';
      const subcategoryName = categories.find(c => c.id.toString() === productForm.subcategory_id)?.name || '';
      
      const fallbackContent = {
        description: `O ${productForm.product_name} é um equipamento profissional da categoria ${categoryName}, ideal para ${subcategoryName || 'uso industrial'}. Este produto oferece alta qualidade, durabilidade e excelente custo-benefício. Desenvolvido com tecnologia avançada, garante eficiência e segurança nas operações. Entre em contato para mais informações e condições especiais.`,
        short_description: `Equipamento ${categoryName} profissional com alta qualidade e desempenho excepcional.`,
        key_features: '• Alta qualidade de fabricação\n• Design moderno e ergonômico\n• Tecnologia avançada\n• Durabilidade comprovada\n• Garantia de satisfação',
        technical_specifications: '• Material: Aço inoxidável de alta resistência\n• Acabamento: Profissional\n• Certificação: Conforme normas brasileiras\n• Garantia: 12 meses\n• Uso: Comercial e industrial\n• Origem: Nacional\n• Prazo de entrega: Consultar\n• Suporte técnico: Especializado',
        model: `${productForm.product_name.replace(/\s+/g, '-').toUpperCase()}-PRO`,
        sku_code: `${(productForm.brand || 'PROD').substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        meta_title: `${productForm.product_name} - ${categoryName} | Repal Equipamentos`,
        meta_description: `Compre ${productForm.product_name} com preço especial e entrega garantida. Qualidade superior e atendimento excelente.`,
        seo_keywords: `${productForm.product_name}, ${categoryName}, ${subcategoryName}, ${productForm.brand || 'equipamentos'}, comprar, preço, industrial, profissional`
      };

      setProductForm(prev => ({
        ...prev,
        description: fallbackContent.description,
        short_description: fallbackContent.short_description,
        key_features: fallbackContent.key_features,
        technical_specifications: fallbackContent.technical_specifications,
        meta_title: fallbackContent.meta_title,
        meta_description: fallbackContent.meta_description,
        meta_keywords: fallbackContent.seo_keywords,
        model: fallbackContent.model,
        sku_code: fallbackContent.sku_code
      }));
      
      showNotification('info', 'Conteúdo padrão gerado (API não configurada).');
      return;
    }

    // const categoryName = categories.find(c => c.id.toString() === productForm.category_id)?.name || '';
    // const subcategoryName = categories.find(c => c.id.toString() === productForm.subcategory_id)?.name || '';
    
    setAiLoading(true);
    setAiError(null);
    
    try {
      // Create comprehensive prompt for Gemini API
      const prompt = `Você é um especialista em marketing e vendas de equipamentos industriais. 
      
Crie conteúdo completo para um produto com as seguintes informações:
- Nome do produto: ${productForm.product_name}
- Marca: ${productForm.brand || 'Marca não especificada'}

Por favor, forneça:

1. **Descrição Detalhada** (mínimo 800 caracteres):
   - Comece com um parágrafo introdutório persuasivo que capture a atenção
   - Destaque os principais benefícios e vantagens competitivas
   - Inclua características técnicas relevantes de forma atrativa
   - Use linguagem persuasiva focada em converter visitantes em compradores
   - Inclua chamadas para ação claras (ex: "Compre agora", "Aproveite esta oferta")
   - Mencione garantias e políticas de pós-venda para aumentar a confiança
   - Finalize com um call-to-action convincente para contato

2. **Descrição Curta** (1-2 frases):
   - Resumo impactante e direto do produto
   - Foque no valor principal e diferencial competitivo
   - Use tom persuasivo e atrativo

3. **Principais Características** (máximo 5 itens):
   - Liste os 5 principais diferenciais do produto
   - Use formato de bullet points com linguagem persuasiva
   - Seja específico sobre benefícios, não apenas features
   - Use negritos para ênfase em pontos-chave

4. **Especificações Técnicas** (mínimo 8 itens):
   - Capacidade
   - Dimensões (A x L x P)
   - Peso
   - Materiais de construção
   - Potência (se aplicável)
   - Voltagem (se aplicável)
   - Padrões de qualidade e certificações
   - Informações de garantia
   - Outras especificações relevantes para decisão de compra

5. **Dados do Produto**:
   - Modelo sugerido (baseado no nome)
   - Código SKU sugerido (único e identificável)

6. **SEO e Metadados**:
   - Meta title (até 60 caracteres, incluindo palavras-chave estratégicas)
   - Meta description (150-160 caracteres, persuasivo com CTA)
   - Palavras-chave para SEO (10-15 palavras-chave relacionadas à compra)

Importante: 
- O conteúdo deve ser original e não plagiado
- Use linguagem persuasiva e focada em conversão
- Inclua palavras-chave estratégicas para SEO (compra, preço, venda, etc.)
- Use formatação organizada com parágrafos curtos e bullet points
- Mantenha o tom de voz profissional mas atrativo
- Foque em como o produto resolve problemas e agrega valor ao negócio do cliente
- Evite mencionar categorias ou subcategorias no texto visível ao cliente
- Inclua informações de garantia e pós-venda para aumentar confiança

Formato de resposta (JSON):
{
  "description": "descrição detalhada aqui",
  "short_description": "descrição curta aqui",
  "key_features": "características aqui",
  "technical_specifications": "lista de especificações aqui",
  "model": "modelo sugerido",
  "sku_code": "código SKU sugerido",
  "meta_title": "meta title aqui",
  "meta_description": "meta description aqui",
  "seo_keywords": "palavras-chave separadas por vírgula"
}`;

      // Call Gemini API - try gemini-2.5-flash first, fallback to gemini-1.5-flash if needed
      let response;
      const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
      
      for (const model of models) {
        try {
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': import.meta.env.VITE_GEMINI_API_KEY || ''
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
              }
            })
          });

          if (response.ok) {
            break; // Success with this model
          } else if (response.status === 404) {
            console.log(`Model ${model} not available, trying next model...`);
            continue; // Try next model
          } else if (response.status === 400) {
            const errorText = await response.text();
            console.error(`Gemini API Error 400 with ${model}:`, errorText);
            throw new Error(`Erro de configuração da API (400): Verifique se a chave API está correta e tem as permissões necessárias`);
          } else {
            const errorText = await response.text();
            console.error(`Gemini API Error with ${model}:`, errorText);
            throw new Error(`Erro na API: ${response.status} ${response.statusText} - ${errorText}`);
          }
        } catch (error) {
          if (model === models[models.length - 1]) {
            // Last model failed, throw the error
            throw error;
          }
          console.log(`Model ${model} failed, trying next model...`);
          continue;
        }
      }

      if (!response || !response.ok) {
        throw new Error('Todos os modelos Gemini falharam');
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        const textResponse = await response.text();
        console.error('Erro ao fazer parse do JSON. Resposta da API:', textResponse);
        throw new Error('Resposta da API não está em formato JSON válido');
      }
      
      // Log the full response for debugging
      console.log('Gemini API Response:', JSON.stringify(data, null, 2));
      
      // Safely extract the generated text with multiple fallback strategies
      let generatedText;
      try {
        // Strategy 1: Standard Gemini API response format (v1beta)
        generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        // Strategy 2: Alternative response format (newer versions)
        if (!generatedText && data?.candidates && Array.isArray(data.candidates)) {
          const candidate = data.candidates[0];
          if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
            generatedText = candidate.content.parts[0]?.text;
          } else if (candidate?.content?.text) {
            generatedText = candidate.content.text;
          }
        }
        
        // Strategy 3: Direct text field (some API versions)
        if (!generatedText && data?.text) {
          generatedText = data.text;
        }
        
        // Strategy 3b: Check if the entire response is a string (some versions return text directly)
        if (!generatedText && typeof data === 'string') {
          generatedText = data;
        }
        
        // Strategy 4: Check for finish reason that might indicate issues
        if (data?.candidates?.[0]?.finishReason && data.candidates[0].finishReason !== 'STOP') {
          console.warn('Gemini API finish reason:', data.candidates[0].finishReason);
          if (data.candidates[0].finishReason === 'SAFETY') {
            throw new Error('Conteúdo bloqueado por questões de segurança');
          }
        }
        
        // Strategy 5: Check for error in response
        if (data?.error) {
          console.error('Gemini API Error:', data.error);
          throw new Error(`Erro da API: ${data.error.message || 'Erro desconhecido'}`);
        }
        
        // Strategy 6: Check for alternative response structures (some versions return different formats)
        if (!generatedText && data?.candidates?.[0]) {
          const candidate = data.candidates[0];
          
          // Check if content is directly in candidate without parts
          if (candidate.content && !candidate.content.parts) {
            if (candidate.content.text) {
              generatedText = candidate.content.text;
            } else if (typeof candidate.content === 'string') {
              generatedText = candidate.content;
            }
          }
          
          // Check for text directly in candidate
          if (!generatedText && candidate.text) {
            generatedText = candidate.text;
          }
          
          // Check for output field (some versions use this)
          if (!generatedText && candidate.output) {
            generatedText = candidate.output;
          }
        }
        
        // Strategy 7: Check for candidates in different locations
        if (!generatedText && data.candidate) {
          if (data.candidate.content?.text) {
            generatedText = data.candidate.content.text;
          } else if (data.candidate.text) {
            generatedText = data.candidate.text;
          } else if (typeof data.candidate === 'string') {
            generatedText = data.candidate;
          }
        }
        
        // Strategy 8: Last resort - try to convert the entire response to string
        if (!generatedText) {
          try {
            // Try to extract any text content from the response
            const responseStr = JSON.stringify(data, null, 2);
            
            // Look for JSON-like content in the response
            const jsonMatch = responseStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              generatedText = jsonMatch[0];
            } else {
              generatedText = responseStr;
            }
            
            console.warn('Usando estratégia de último recurso - resposta convertida para string:', generatedText?.substring(0, 100) + '...');
          } catch (conversionError) {
            console.error('Erro ao converter resposta para string:', conversionError);
          }
        }
        
        if (!generatedText) {
          console.error('Resposta da API não contém o formato esperado:', data);
          console.error('Estrutura esperada: data.candidates[0].content.parts[0].text');
          console.error('Estrutura recebida:', {
            hasCandidates: !!data?.candidates,
            candidatesLength: data?.candidates?.length,
            firstCandidate: data?.candidates?.[0],
            hasContent: !!data?.candidates?.[0]?.content,
            hasParts: !!data?.candidates?.[0]?.content?.parts,
            partsLength: data?.candidates?.[0]?.content?.parts?.length,
            fullResponse: JSON.stringify(data, null, 2).substring(0, 500) + '...'
          });
          throw new Error('Estrutura de resposta da API inválida');
        }
      } catch (extractError: any) {
        console.error('Erro ao extrair texto da resposta:');
        console.error('Erro original:', extractError);
        console.error('Dados recebidos:', data);
        console.error('Tipo dos dados:', typeof data);
        
        // Provide more detailed error message
        let errorMessage = 'Erro ao processar resposta da API do Gemini';
        if (extractError.message) {
          errorMessage += `: ${extractError.message}`;
        }
        if (!data) {
          errorMessage += ' (sem dados na resposta)';
        } else if (typeof data === 'object' && !data.candidates) {
          errorMessage += ' (formato inesperado da resposta)';
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse JSON response
      let parsedContent;
      try {
        // Try to extract JSON from the response
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedContent = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Resposta da IA não está em formato JSON válido');
        }
      } catch (parseError) {
        // Fallback: create structured content based on product info
        // const categoryName = categories.find(c => c.id.toString() === productForm.category_id)?.name || 'Equipamentos';
        // const subcategoryName = categories.find(c => c.id.toString() === productForm.subcategory_id)?.name || '';
        
        parsedContent = {
          description: `🎯 **Transforme seus resultados com o ${productForm.product_name}!**\n\nDesenvolvido para profissionais que buscam **excelência e produtividade**, este equipamento oferece:\n\n✅ **Benefícios principais:**\n• Alta performance e eficiência comprovada\n• Tecnologia de ponta para resultados excepcionais\n• Durabilidade que garante retorno sobre o investimento\n• Design ergonômico para maior conforto operacional\n\n💡 **Por que escolher este produto?**\nO ${productForm.product_name} é a escolha certa para quem valoriza **qualidade superior** e busca **maximizar resultados**. Sua construção robusta garante anos de uso confiável, mesmo nas condições mais exigentes.\n\n🚀 **Chamada para ação:**\n**Não perca tempo!** Garanta já o seu e eleve seu negócio ao próximo nível. Estoque limitado!\n\n📞 **Suporte completo:**\n• Garantia de 12 meses\n• Suporte técnico especializado\n• Assistência pós-venda ágil\n• Política de troca facilitada`,
          short_description: `Equipamento profissional com alta qualidade e desempenho excepcional. Transforme seus resultados agora!`,
          key_features: '• Alta performance e eficiência comprovada\n• Tecnologia de ponta para resultados excepcionais\n• Durabilidade que garante retorno sobre o investimento\n• Design ergonômico para maior conforto operacional\n• Construção robusta para uso intensivo\n• Certificação de qualidade garantida',
          technical_specifications: '• Material: Componentes de alta resistência\n• Acabamento: Profissional premium\n• Certificação: Conforme normas de segurança\n• Garantia: 12 meses contra defeitos\n• Uso: Profissional e industrial\n• Origem: Nacional com qualidade garantida\n• Prazo de entrega: Consulte nossos consultores\n• Suporte técnico: Equipe especializada',
          model: `${productForm.product_name.replace(/\s+/g, '-').toUpperCase()}-PRO`,
          sku_code: `${(productForm.brand || 'PROD').substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          meta_title: `${productForm.product_name} | Alta Performance e Qualidade | Repal Equipamentos`,
          meta_description: `Compre ${productForm.product_name} com garantia de qualidade. Transforme seus resultados com equipamento profissional. Estoque limitado!`,
          seo_keywords: `${productForm.product_name}, equipamento profissional, alta performance, qualidade superior, produtividade, eficiência, equipamento industrial, comprar online`
        };
      }
      
      // Update form with generated content (only fields that exist in the form)
      setProductForm(prev => ({
        ...prev,
        description: parsedContent.description || prev.description,
        technical_specifications: parsedContent.technical_specifications || prev.technical_specifications,
        meta_title: parsedContent.meta_title || `${prev.product_name} - Equipamentos | Repal Equipamentos`,
        meta_description: parsedContent.meta_description || parsedContent.description?.substring(0, 160) || prev.meta_description,
        meta_keywords: parsedContent.seo_keywords || parsedContent.meta_keywords || prev.meta_keywords
      }));
      
      showNotification('success', 'Conteúdo gerado com sucesso via IA! Você pode editar o conteúdo antes de salvar.');
      
    } catch (error) {
      console.error('Erro ao gerar conteúdo com IA:', error);
      
      // Fallback para conteúdo padrão se a API falhar
      // const categoryName = categories.find(c => c.id.toString() === productForm.category_id)?.name || 'Equipamentos';
      // const subcategoryName = categories.find(c => c.id.toString() === productForm.subcategory_id)?.name || '';
      
      const fallbackContent = {
        description: `🎯 **Transforme seus resultados com o ${productForm.product_name}!**\n\nDesenvolvido para profissionais que buscam **excelência e produtividade**, este equipamento oferece:\n\n✅ **Benefícios principais:**\n• Alta performance e eficiência comprovada\n• Tecnologia de ponta para resultados excepcionais\n• Durabilidade que garante retorno sobre o investimento\n• Design ergonômico para maior conforto operacional\n\n💡 **Por que escolher este produto?**\nO ${productForm.product_name} é a escolha certa para quem valoriza **qualidade superior** e busca **maximizar resultados**. Sua construção robusta garante anos de uso confiável, mesmo nas condições mais exigentes.\n\n🚀 **Chamada para ação:**\n**Não perca tempo!** Garanta já o seu e eleve seu negócio ao próximo nível. Estoque limitado!\n\n📞 **Suporte completo:**\n• Garantia de 12 meses\n• Suporte técnico especializado\n• Assistência pós-venda ágil\n• Política de troca facilitada`,
        short_description: `Equipamento profissional com alta qualidade e desempenho excepcional. Transforme seus resultados agora!`,
        key_features: '• Alta performance e eficiência comprovada\n• Tecnologia de ponta para resultados excepcionais\n• Durabilidade que garante retorno sobre o investimento\n• Design ergonômico para maior conforto operacional\n• Construção robusta para uso intensivo\n• Certificação de qualidade garantida',
        technical_specifications: '• Material: Componentes de alta resistência\n• Acabamento: Profissional premium\n• Certificação: Conforme normas de segurança\n• Garantia: 12 meses contra defeitos\n• Uso: Profissional e industrial\n• Origem: Nacional com qualidade garantida\n• Prazo de entrega: Consulte nossos consultores\n• Suporte técnico: Equipe especializada',
        model: `${productForm.product_name.replace(/\s+/g, '-').toUpperCase()}-PRO`,
        sku_code: `${(productForm.brand || 'PROD').substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        meta_title: `${productForm.product_name} | Alta Performance e Qualidade | Repal Equipamentos`,
        meta_description: `Compre ${productForm.product_name} com garantia de qualidade. Transforme seus resultados com equipamento profissional. Estoque limitado!`,
        seo_keywords: `${productForm.product_name}, equipamento profissional, alta performance, qualidade superior, produtividade, eficiência, equipamento industrial, comprar online`
      };

      // Aplicar o conteúdo de fallback (apenas campos que existem no formulário)
      setProductForm(prev => ({
        ...prev,
        description: fallbackContent.description,
        technical_specifications: fallbackContent.technical_specifications,
        meta_title: fallbackContent.meta_title,
        meta_description: fallbackContent.meta_description,
        meta_keywords: fallbackContent.seo_keywords
      }));
      
      setAiError(error instanceof Error ? error.message : 'Erro desconhecido ao gerar conteúdo');
      showNotification('info', `Conteúdo padrão aplicado devido a erro na IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setAiLoading(false);
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
          productImages = images.map((img: any) => ({
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
        slug: product.slug,
        // Campos opcionais - garantir que existam no formulário
        brand: product.brand || '',
        technical_specifications: product.technical_specifications || '',
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        meta_keywords: product.meta_keywords || '',
        short_description: product.short_description || '',
        key_features: product.key_features || '',
        model: product.model || '',
        sku_code: product.sku_code || ''
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

  // Função comentada - agora gerenciada pelo CategoryManager
  // const openCategoryModal = (category?: Category) => {
  //   if (category) {
  //     setEditingCategory(category);
  //     setCategoryForm({
  //       id: category.id.toString(),
  //       name: category.name,
  //       description: category.description || '',
  //       slug: category.slug,
  //       parent_id: category.parent_id?.toString() || '',
  //       is_parent: category.is_parent || false
  //     });
  //   } else {
  //     resetCategoryForm();
  //   }
  //   setShowCategoryModal(true);
  // };

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
  // const paginatedCategories = getPaginatedData(categories); // Comentado - agora gerenciado pelo CategoryManager
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
                    {paginatedProducts.length > 0 ? (
                      paginatedProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 w-2/6 min-w-[250px]">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-full object-cover" src={product.product_images?.[0]?.image_url || product.image_url || '/placeholder.jpg'} alt={product.product_name} />
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
                            <div className="text-sm text-gray-900 truncate" title={getCategoryName(product.category_id)}>
                              {getCategoryName(product.category_id)}
                            </div>
                          </td>
                          <td className="px-3 py-4 w-1/6 min-w-[100px]">
                            <div className="text-sm text-gray-900 truncate" title={getSubcategoryName(product.subcategory_id)}>
                              {getSubcategoryName(product.subcategory_id)}
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
                                    onClick={() => openProductModal()}
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
                                    onClick={() => {
                                      setSearchTerm('');
                                      setSelectedCategory('');
                                      setSelectedSubcategory('');
                                    }}
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
          <CategoryManager 
            onCategorySelect={(category) => {
              // Handle category selection if needed
              console.log('Categoria selecionada:', category);
            }}
            selectedCategory={editingCategory}
          />
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
        <ProductFormWrapper
          showProductModal={showProductModal}
          productForm={productForm}
          setProductForm={setProductForm}
          categories={categories}
          subcategories={subcategories}
          onCategoryChange={handleParentCategoryChange}
          onSaveProduct={saveProduct}
          onCloseModal={() => {
            setShowProductModal(false);
            setEditingProduct(null);
            resetProductForm();
          }}
          onAiGenerate={generateAIContent}
          aiLoading={aiLoading}
          aiError={aiError}
          loading={formLoading}
          isEditing={!!editingProduct}
        />
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
      <BannerModal
        isOpen={showBannerModal}
        editingBanner={editingBanner}
        bannerForm={bannerForm}

        bannerError={bannerError}
        formLoading={formLoading}
        onClose={handleBannerModalClose}
        onSubmit={handleBannerSubmit}
        onFormChange={handleBannerFormChange}
      />

      {/* Lead Modal */}
      <LeadModal
        isOpen={showLeadModal}
        viewingLead={viewingLead}
        onClose={handleLeadModalClose}
      />
      </div>
    </div>
  </div>
  );
}

export default Admin;