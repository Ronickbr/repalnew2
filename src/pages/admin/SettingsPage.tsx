import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { isValidUrl as isValidUrlStrict, formatCanonicalUrl, sanitizeMetaDescription, sanitizeMetaTitle, normalizeKeywords } from '../../lib/seo';
import { table } from '../../lib/schema';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { Save, RefreshCw, Globe, Mail, Phone, MapPin, Store, Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import SettingsManager, { SiteSettings as FlatSiteSettings } from '../../components/admin/SettingsManager';
import SettingsModal from '../../components/admin/SettingsModal';

interface SiteInfo {
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  favicon?: string;
}

interface Integrations {
  google_analytics_id?: string;
  google_tag_manager_id?: string;
  facebook_pixel_id?: string;
  gemini_api_key?: string;
  recaptcha_site_key?: string;
  recaptcha_secret_key?: string;
}

interface Maintenance {
  enabled?: boolean;
  message?: string;
  allowed_ips?: string[];
  scheduled_end?: string;
}

interface Theme {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
  font_size?: string;
}

interface Contact {
  email?: string;
  phone?: string;
  address?: string;
  working_hours?: string;
  map_embed?: string;
}

interface SocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  whatsapp?: string;
}

interface SEO {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  robots_txt?: string;
  sitemap_enabled?: boolean;
  canonical_url?: string;
  sitemap_xml?: string;
}

interface Store {
  id?: number;
  name: string;
  whatsapp_number?: string;
  email?: string;
  phone?: string;
  address?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SiteSettings {
  id?: number;
  site_info?: SiteInfo;
  integrations?: Integrations;
  maintenance?: Maintenance;
  theme?: Theme;
  contact?: Contact;
  social_media?: SocialMedia;
  seo?: SEO;
  created_at?: string;
  updated_at?: string;
}

interface SettingsSection {
  key: keyof Omit<SiteSettings, 'id' | 'created_at' | 'updated_at'>;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const SettingsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>({});
  const [formData, setFormData] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('site_info');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stores, setStores] = useState<Store[]>([]);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeForm, setStoreForm] = useState<Partial<Store>>({});
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeSearch, setStoreSearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const flattenSettings = (nested: SiteSettings): FlatSiteSettings => {
    return {
      site_name: nested.site_info?.name || '',
      site_description: nested.site_info?.description || '',
      site_url: nested.site_info?.url || '',
      meta_title: nested.seo?.meta_title || '',
      meta_description: nested.seo?.meta_description || '',
      meta_keywords: nested.seo?.meta_keywords || '',
      meta_robots: nested.seo?.robots_txt || '',
      canonical_url: nested.seo?.canonical_url || '',
      google_analytics_id: nested.integrations?.google_analytics_id || '',
      google_tag_manager_id: nested.integrations?.google_tag_manager_id || '',
      facebook_pixel_id: nested.integrations?.facebook_pixel_id || '',
      recaptcha_site_key: nested.integrations?.recaptcha_site_key || '',
      recaptcha_secret_key: nested.integrations?.recaptcha_secret_key || '',
      contact_email: nested.contact?.email || '',
      contact_phone: nested.contact?.phone || '',
      address: nested.contact?.address || '',
      business_hours: nested.contact?.working_hours || '',
      maintenance_mode: nested.maintenance?.enabled || false,
      primary_color: nested.theme?.primary_color || '#dc2626',
      secondary_color: nested.theme?.secondary_color || '#7c2d12',
      logo_url: nested.site_info?.logo || '',
      favicon_url: nested.site_info?.favicon || '',
      instagram_account: nested.social_media?.instagram || '',
      whatsapp_number: nested.social_media?.whatsapp || '',
      
      // Default values for fields not yet in nested structure
      cache_enabled: false,
      compress_images: false,
      lazy_loading: false,
      allow_robots: true,
    };
  };

  const nestSettings = (flat: FlatSiteSettings): SiteSettings => {
    return {
      ...formData,
      site_info: {
        ...formData.site_info,
        name: flat.site_name,
        description: flat.site_description,
        url: flat.site_url,
        logo: flat.logo_url,
        favicon: flat.favicon_url,
      },
      seo: {
        ...formData.seo,
        meta_title: flat.meta_title,
        meta_description: flat.meta_description,
        meta_keywords: flat.meta_keywords,
        robots_txt: flat.meta_robots,
        canonical_url: flat.canonical_url,
      },
      integrations: {
        ...formData.integrations,
        google_analytics_id: flat.google_analytics_id,
        google_tag_manager_id: flat.google_tag_manager_id,
        facebook_pixel_id: flat.facebook_pixel_id,
        recaptcha_site_key: flat.recaptcha_site_key,
        recaptcha_secret_key: flat.recaptcha_secret_key,
      },
      contact: {
        ...formData.contact,
        email: flat.contact_email,
        phone: flat.contact_phone,
        address: flat.address,
        working_hours: flat.business_hours,
      },
      maintenance: {
        ...formData.maintenance,
        enabled: flat.maintenance_mode,
      },
      theme: {
        ...formData.theme,
        primary_color: flat.primary_color,
        secondary_color: flat.secondary_color,
      },
      social_media: {
        ...formData.social_media,
        instagram: flat.instagram_account,
        whatsapp: flat.whatsapp_number,
      },
    };
  };

  const sections: SettingsSection[] = [
    {
      key: 'site_info',
      title: 'Configurações do Site',
      icon: <Globe className="w-5 h-5" />,
      description: 'Gerencie todas as configurações do site'
    },
  ];

  const defaultValues = {
    site_info: {
      name: '',
      description: '',
      url: '',
      logo: '',
      favicon: ''
    },
    integrations: {
      google_analytics_id: '',
      google_tag_manager_id: '',
      facebook_pixel_id: '',
      gemini_api_key: '',
      recaptcha_site_key: '',
      recaptcha_secret_key: ''
    },
    maintenance: {
      enabled: false,
      message: 'Estamos em manutenção. Voltaremos em breve!',
      allowed_ips: [],
      scheduled_end: ''
    },
    theme: {
      primary_color: '#dc2626',
      secondary_color: '#7c2d12',
      accent_color: '#ea580c',
      background_color: '#ffffff',
      text_color: '#1f2937',
      font_family: 'Inter',
      font_size: '16px'
    },
    contact: {
      email: '',
      phone: '',
      address: '',
      working_hours: '',
      map_embed: ''
    },
    social_media: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
      whatsapp: ''
    },
    seo: {
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      robots_txt: '',
      sitemap_enabled: true,
      canonical_url: '',
      sitemap_xml: ''
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeSection === 'stores') {
      fetchStores();
    }
  }, [activeSection]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrors({});

      if (!isSupabaseConfigured) {
        throw new Error('Supabase não está configurado');
      }

      const { data, error } = await supabase
        .from(table('site_settings'))
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const loadedSettings = data || {};
      const mergedSettings = mergeWithDefaults(loadedSettings);
      
      setSettings(mergedSettings);
      setFormData(mergedSettings);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações');
      setErrors({ general: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const mergeWithDefaults = (settings: SiteSettings): SiteSettings => {
    const merged = { ...settings };
    
    Object.keys(defaultValues).forEach(key => {
      const sectionKey = key as keyof typeof defaultValues;
      merged[sectionKey] = {
        ...defaultValues[sectionKey],
        ...(settings[sectionKey] || {})
      };
    });

    return merged;
  };

  const validateSection = (sectionKey: string): boolean => {
    const newErrors = { ...errors };
    delete newErrors[sectionKey];

    const section = formData[sectionKey as keyof SiteSettings] as any;
    
    switch (sectionKey) {
      case 'site_info':
        if (section?.name && section.name.length > 100) {
          newErrors[sectionKey] = 'Nome do site não pode ter mais de 100 caracteres';
        }
        if (section?.url && !isValidUrl(section.url)) {
          newErrors[sectionKey] = 'URL inválida';
        }
        break;
      
      case 'contact':
        if (section?.email && !isValidEmail(section.email)) {
          newErrors[sectionKey] = 'Email inválido';
        }
        if (section?.phone && !isValidPhone(section.phone)) {
          newErrors[sectionKey] = 'Telefone inválido';
        }
        break;
      
      case 'seo':
        if (section?.meta_title && section.meta_title.length > 60) {
          newErrors[sectionKey] = 'Meta título não pode ter mais de 60 caracteres';
        }
        if (section?.meta_description && section.meta_description.length > 160) {
          newErrors[sectionKey] = 'Meta descrição não pode ter mais de 160 caracteres';
        }
        if (section?.canonical_url) {
          const formatted = formatCanonicalUrl(section.canonical_url);
          if (!isValidUrlStrict(formatted)) {
            newErrors[sectionKey] = 'URL canônica inválida';
          }
        }
        break;
    }

    setErrors(newErrors);
    return !newErrors[sectionKey];
  };

  const isValidUrl = (url: string): boolean => {
    return isValidUrlStrict(url);
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\+\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const saveSettings = async (settingsOverride?: SiteSettings) => {
    try {
      if (!hasPermission('manage_settings')) {
        toast.error('Você não tem permissão para alterar configurações');
        return;
      }

      if (!settingsOverride && !validateSection(activeSection)) {
        toast.error('Por favor, corrija os erros antes de salvar');
        return;
      }

      setSaving(true);

      if (!isSupabaseConfigured) {
        throw new Error('Supabase não está configurado');
      }

      const settingsToUse = settingsOverride || formData;

      const sanitizedSeo = {
        ...settingsToUse.seo,
        meta_title: sanitizeMetaTitle(settingsToUse.seo?.meta_title),
        meta_description: sanitizeMetaDescription(settingsToUse.seo?.meta_description),
        meta_keywords: normalizeKeywords(settingsToUse.seo?.meta_keywords),
        canonical_url: settingsToUse.seo?.canonical_url ? formatCanonicalUrl(settingsToUse.seo.canonical_url) : ''
      };

      if (sanitizedSeo.canonical_url && !isValidUrlStrict(sanitizedSeo.canonical_url)) {
        throw new Error('URL canônica inválida');
      }

      const settingsToSave = {
        ...settingsToUse,
        seo: sanitizedSeo,
        updated_at: new Date().toISOString()
      };



      let error;
      if (settings.id) {
        const result = await supabase
          .from(table('site_settings'))
          .update(settingsToSave)
          .eq('id', settings.id);
        error = result.error;
        
      } else {
        const result = await supabase
          .from(table('site_settings'))
          .insert([{ ...settingsToSave, created_at: new Date().toISOString() }]);
        error = result.error;
        
      }

      if (error) throw error;

      try {
        const robotsContent = settingsToSave.seo?.robots_txt || '';
        const sitemapEnabled = !!settingsToSave.seo?.sitemap_enabled;
        const baseUrl = (settingsToSave.site_info?.url || settingsToSave.seo?.canonical_url || '').trim();

        const { apiFetch, ensureCsrf } = await import('../../lib/api');
        await ensureCsrf();
        if (robotsContent || robotsContent === '') {
          await apiFetch('/api/seo/robots', {
            method: 'POST',
            body: JSON.stringify({ content: robotsContent })
          }, true);
        }

        await apiFetch('/api/seo/sitemap', {
          method: 'POST',
          body: JSON.stringify({ enabled: sitemapEnabled, baseUrl, content: settingsToSave.seo?.sitemap_xml || '' })
        }, true);
      } catch (e) {
        console.error(e);
        toast.error(e instanceof Error ? e.message : 'Erro ao atualizar arquivos SEO');
      }

      setSettings(settingsToSave);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
      setErrors({ general: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  // Funções de gerenciamento de lojas
  const fetchStores = async () => {
    try {
      setStoreLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      toast.error('Erro ao carregar lojas');
    } finally {
      setStoreLoading(false);
    }
  };

  const handleStoreSubmit = async () => {
    try {
      if (!hasPermission('manage_settings')) {
        toast.error('Você não tem permissão para gerenciar lojas');
        return;
      }

      if (!storeForm.name?.trim()) {
        toast.error('Nome da loja é obrigatório');
        return;
      }

      if (storeForm.email && !isValidEmail(storeForm.email)) {
        toast.error('Email inválido');
        return;
      }

      if (storeForm.whatsapp_number && !isValidPhone(storeForm.whatsapp_number)) {
        toast.error('Número de WhatsApp inválido');
        return;
      }

      const { id, created_at, ...rest } = storeForm;
      const storeData = {
        ...rest,
        name: storeForm.name?.trim(),
        active: storeForm.active ?? true,
        updated_at: new Date().toISOString()
      };

      let error;
      if (editingStore?.id) {
        // Atualizar loja existente
        const result = await supabase
          .from('stores')
          .update(storeData)
          .eq('id', editingStore.id);
        error = result.error;
      } else {
        // Criar nova loja
        const result = await supabase
          .from('stores')
          .insert([{ ...storeData, created_at: new Date().toISOString() }]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(editingStore ? 'Loja atualizada com sucesso!' : 'Loja criada com sucesso!');
      resetStoreForm();
      fetchStores();
    } catch (error) {
      console.error('Erro ao salvar loja:', error);
      toast.error('Erro ao salvar loja');
    }
  };

  const handleStoreEdit = (store: Store) => {
    setEditingStore(store);
    setStoreForm(store);
    setShowStoreForm(true);
  };

  const handleStoreDelete = async (storeId: number) => {
    try {
      if (!hasPermission('manage_settings')) {
        toast.error('Você não tem permissão para excluir lojas');
        return;
      }

      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;

      toast.success('Loja excluída com sucesso!');
      fetchStores();
    } catch (error) {
      console.error('Erro ao excluir loja:', error);
      toast.error('Erro ao excluir loja');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const resetStoreForm = () => {
    setStoreForm({});
    setEditingStore(null);
    setShowStoreForm(false);
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
    store.email?.toLowerCase().includes(storeSearch.toLowerCase()) ||
    store.phone?.includes(storeSearch) ||
    store.address?.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const renderSectionContent = (sectionKey: string) => {
    switch (sectionKey) {
      case 'site_info':
        return (
          <SettingsManager 
            siteSettings={flattenSettings(formData)} 
            onEditSettings={() => setShowModal(true)} 
          />
        );
      
      case 'stores':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Gerenciar Lojas</h3>
                <p className="text-sm text-gray-500">Adicione, edite e gerencie suas lojas físicas</p>
              </div>
              <button
                onClick={() => {
                  setEditingStore(null);
                  setStoreForm({});
                  setShowStoreForm(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Loja
              </button>
            </div>

            {/* Barra de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar lojas por nome, email, telefone ou endereço..."
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>

            {/* Lista de lojas */}
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
              {storeLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Carregando lojas...</p>
                </div>
              ) : filteredStores.length === 0 ? (
                <div className="p-8 text-center">
                  <Store className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma loja encontrada</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {storeSearch ? 'Nenhuma loja corresponde à sua busca.' : 'Comece criando uma nova loja.'}
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setEditingStore(null);
                        setStoreForm({});
                        setShowStoreForm(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Loja
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredStores.map((store) => (
                    <div key={store.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="text-lg font-medium text-gray-900">{store.name}</h4>
                            <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              store.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {store.active ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500">
                            {store.whatsapp_number && (
                              <div className="flex items-center">
                                <Phone className="flex-shrink-0 h-4 w-4 mr-1" />
                                WhatsApp: {store.whatsapp_number}
                              </div>
                            )}
                            {store.phone && (
                              <div className="flex items-center">
                                <Phone className="flex-shrink-0 h-4 w-4 mr-1" />
                                {store.phone}
                              </div>
                            )}
                            {store.email && (
                              <div className="flex items-center">
                                <Mail className="flex-shrink-0 h-4 w-4 mr-1" />
                                {store.email}
                              </div>
                            )}
                            {store.address && (
                              <div className="flex items-center col-span-1 sm:col-span-2">
                                <MapPin className="flex-shrink-0 h-4 w-4 mr-1" />
                                {store.address}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-6 flex items-center space-x-2">
                          <button
                            onClick={() => handleStoreEdit(store)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(store.id!)}
                            className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal de formulário de loja */}
            {showStoreForm && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {editingStore ? 'Editar Loja' : 'Nova Loja'}
                      </h3>
                      <button
                        onClick={resetStoreForm}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <span className="sr-only">Fechar</span>
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="px-6 py-4 space-y-6">
                    <div>
                      <label htmlFor="store-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Loja *
                      </label>
                      <input
                        id="store-name"
                        type="text"
                        value={storeForm.name || ''}
                        onChange={(e) => setStoreForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        placeholder="Nome da loja"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="store-whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                          WhatsApp
                        </label>
                        <input
                          id="store-whatsapp"
                          type="tel"
                          value={storeForm.whatsapp_number || ''}
                          onChange={(e) => setStoreForm(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                          placeholder="+55 (00) 00000-0000"
                        />
                      </div>
                      <div>
                        <label htmlFor="store-phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone
                        </label>
                        <input
                          id="store-phone"
                          type="tel"
                          value={storeForm.phone || ''}
                          onChange={(e) => setStoreForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                          placeholder="(00) 0000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="store-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        id="store-email"
                        type="email"
                        value={storeForm.email || ''}
                        onChange={(e) => setStoreForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        placeholder="loja@exemplo.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="store-address" className="block text-sm font-medium text-gray-700 mb-1">
                        Endereço
                      </label>
                      <textarea
                        id="store-address"
                        value={storeForm.address || ''}
                        onChange={(e) => setStoreForm(prev => ({ ...prev, address: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        placeholder="Endereço completo da loja"
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={storeForm.active ?? true}
                          onChange={(e) => setStoreForm(prev => ({ ...prev, active: e.target.checked }))}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Loja ativa</span>
                      </label>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                      onClick={resetStoreForm}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleStoreSubmit}
                      disabled={!storeForm.name?.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingStore ? 'Atualizar' : 'Criar'} Loja
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de confirmação de exclusão */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <div className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-10 w-10 text-red-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          Confirmar exclusão
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Tem certeza que deseja excluir esta loja? Esta ação não pode ser desfeita.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleStoreDelete(showDeleteConfirm)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir Loja
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return <div>Seção não implementada</div>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="lg:col-span-3">
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errors.general) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <p>{errors.general}</p>
          <button 
            onClick={fetchSettings}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações do Site</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gerencie todas as configurações do seu site
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button
              onClick={fetchSettings}
              disabled={saving}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
              Recarregar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu lateral */}
        <div className="lg:col-span-1">
          <nav className="bg-white shadow rounded-lg p-4">
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.key}>
                  <button
                    onClick={() => setActiveSection(section.key)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                      activeSection === section.key
                        ? 'bg-red-100 text-red-700 border-r-2 border-red-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{section.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{section.title}</div>
                      <div className="text-xs text-gray-500 truncate">{section.description}</div>
                    </div>
                  </button>
                </li>
              ))}
              {/* Seção de Lojas - separada pois não faz parte do site_settings */}
              <li>
                <button
                  onClick={() => setActiveSection('stores')}
                  className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                    activeSection === 'stores'
                      ? 'bg-red-100 text-red-700 border-r-2 border-red-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3"><Store className="w-5 h-5" /></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">Lojas</div>
                    <div className="text-xs text-gray-500 truncate">Gerenciar lojas físicas</div>
                  </div>
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Conteúdo principal */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {sections.find(s => s.key === activeSection)?.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {sections.find(s => s.key === activeSection)?.description}
                  </p>
                </div>
                {errors[activeSection] && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
                    {errors[activeSection]}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-6">
              {renderSectionContent(activeSection)}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setFormData(settings)}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => saveSettings()}
                disabled={saving || !hasPermission('manage_settings')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <SettingsModal
          show={showModal}
          onClose={() => setShowModal(false)}
          settings={flattenSettings(formData)}
          onSave={(updatedFlatSettings) => {
            const nested = nestSettings(updatedFlatSettings);
            setFormData(nested);
            saveSettings(nested);
            setShowModal(false);
          }}
          onChange={() => {}}
          loading={saving}
        />
      )}
    </div>
  );
};

export default SettingsPage;
