import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { table } from '../../lib/schema';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { Save, RefreshCw, Globe, Mail, Phone, MapPin, Code, Palette, Settings, Shield, Store, Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';

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

  const sections: SettingsSection[] = [
    {
      key: 'site_info',
      title: 'Informações do Site',
      icon: <Globe className="w-5 h-5" />,
      description: 'Configurações básicas do site'
    },
    {
      key: 'contact',
      title: 'Contato',
      icon: <Mail className="w-5 h-5" />,
      description: 'Informações de contato'
    },
    {
      key: 'social_media',
      title: 'Redes Sociais',
      icon: <Phone className="w-5 h-5" />,
      description: 'Links de redes sociais'
    },
    {
      key: 'integrations',
      title: 'Integrações',
      icon: <Code className="w-5 h-5" />,
      description: 'Configurações de serviços externos'
    },
    {
      key: 'theme',
      title: 'Aparência',
      icon: <Palette className="w-5 h-5" />,
      description: 'Cores e estilos do site'
    },
    {
      key: 'seo',
      title: 'SEO',
      icon: <Settings className="w-5 h-5" />,
      description: 'Configurações de otimização'
    },
    {
      key: 'maintenance',
      title: 'Manutenção',
      icon: <Shield className="w-5 h-5" />,
      description: 'Modo de manutenção'
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
      canonical_url: ''
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
        break;
    }

    setErrors(newErrors);
    return !newErrors[sectionKey];
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\+\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...((prev as any)[section] || {}),
        [field]: value
      }
    }));

    // Limpar erro ao digitar
    if (errors[section]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[section];
        return newErrors;
      });
    }
  };

  const handleArrayInputChange = (section: string, field: string, value: string) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(Boolean);
    handleInputChange(section, field, arrayValue);
  };

  const saveSettings = async () => {
    try {
      if (!hasPermission('manage_settings')) {
        toast.error('Você não tem permissão para alterar configurações');
        return;
      }

      if (!validateSection(activeSection)) {
        toast.error('Por favor, corrija os erros antes de salvar');
        return;
      }

      setSaving(true);

      if (!isSupabaseConfigured) {
        throw new Error('Supabase não está configurado');
      }

      const settingsToSave = {
        ...formData,
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

      setSettings(formData);
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

      const storeData = {
        ...storeForm,
        name: storeForm.name.trim(),
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

  const renderInputField = (section: string, field: string, value: any, type: string = 'text', placeholder: string = '', options?: any) => {
    const inputId = `${section}-${field}`;
    
    const baseInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm";
    
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={inputId}
            value={value || ''}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            placeholder={placeholder}
            rows={options?.rows || 3}
            className={baseInputClass}
          />
        );
      
      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <input
              id={inputId}
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleInputChange(section, field, e.target.value)}
              className="h-10 w-10 border border-gray-300 rounded-md cursor-pointer"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleInputChange(section, field, e.target.value)}
              placeholder={placeholder}
              className={baseInputClass}
            />
          </div>
        );
      
      case 'checkbox':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              id={inputId}
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleInputChange(section, field, e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">{options?.label || 'Ativar'}</span>
          </label>
        );
      
      case 'array':
        return (
          <textarea
            id={inputId}
            value={(value || []).join(', ')} 
            onChange={(e) => handleArrayInputChange(section, field, e.target.value)}
            placeholder={placeholder || 'Separe os valores por vírgula'}
            rows={3}
            className={baseInputClass}
          />
        );
      
      default:
        return (
          <input
            id={inputId}
            type={type}
            value={value || ''}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            placeholder={placeholder}
            className={baseInputClass}
            {...options}
          />
        );
    }
  };

  const renderSectionContent = (sectionKey: string) => {
    const sectionData = (formData as any)[sectionKey] || {};
    
    switch (sectionKey) {
      case 'site_info':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="site_info-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Site *
                </label>
                {renderInputField('site_info', 'name', sectionData.name, 'text', 'Nome do seu site')}
              </div>
              <div>
                <label htmlFor="site_info-url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Site
                </label>
                {renderInputField('site_info', 'url', sectionData.url, 'url', 'https://seusite.com')}
              </div>
            </div>
            <div>
              <label htmlFor="site_info-description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição do Site
              </label>
              {renderInputField('site_info', 'description', sectionData.description, 'textarea', 'Descrição breve do seu site', { rows: 3 })}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="site_info-logo" className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Logo
                </label>
                {renderInputField('site_info', 'logo', sectionData.logo, 'text', 'https://seusite.com/logo.png')}
              </div>
              <div>
                <label htmlFor="site_info-favicon" className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Favicon
                </label>
                {renderInputField('site_info', 'favicon', sectionData.favicon, 'text', 'https://seusite.com/favicon.ico')}
              </div>
            </div>
          </div>
        );
      
      case 'contact':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email de Contato
                </label>
                {renderInputField('contact', 'email', sectionData.email, 'email', 'contato@seusite.com')}
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                {renderInputField('contact', 'phone', sectionData.phone, 'tel', '(00) 0000-0000')}
              </div>
            </div>
            <div>
              <label htmlFor="contact-address" className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              {renderInputField('contact', 'address', sectionData.address, 'textarea', 'Seu endereço completo', { rows: 2 })}
            </div>
            <div>
              <label htmlFor="contact-working_hours" className="block text-sm font-medium text-gray-700 mb-1">
                Horário de Funcionamento
              </label>
              {renderInputField('contact', 'working_hours', sectionData.working_hours, 'text', 'Seg-Sex: 9h-18h')}
            </div>
            <div>
              <label htmlFor="contact-map_embed" className="block text-sm font-medium text-gray-700 mb-1">
                Mapa Embutido (iframe)
              </label>
              {renderInputField('contact', 'map_embed', sectionData.map_embed, 'textarea', 'Código iframe do Google Maps', { rows: 3 })}
            </div>
          </div>
        );
      
      case 'social_media':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="social_media-facebook" className="block text-sm font-medium text-gray-700 mb-1">
                Facebook
              </label>
              {renderInputField('social_media', 'facebook', sectionData.facebook, 'url', 'https://facebook.com/seupage')}
            </div>
            <div>
              <label htmlFor="social_media-instagram" className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              {renderInputField('social_media', 'instagram', sectionData.instagram, 'text', '@seuusuario')}
            </div>
            <div>
              <label htmlFor="social_media-twitter" className="block text-sm font-medium text-gray-700 mb-1">
                Twitter
              </label>
              {renderInputField('social_media', 'twitter', sectionData.twitter, 'text', '@seuusuario')}
            </div>
            <div>
              <label htmlFor="social_media-linkedin" className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn
              </label>
              {renderInputField('social_media', 'linkedin', sectionData.linkedin, 'url', 'https://linkedin.com/company/suaempresa')}
            </div>
            <div>
              <label htmlFor="social_media-youtube" className="block text-sm font-medium text-gray-700 mb-1">
                YouTube
              </label>
              {renderInputField('social_media', 'youtube', sectionData.youtube, 'url', 'https://youtube.com/channel/seucanal')}
            </div>
            <div>
              <label htmlFor="social_media-whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              {renderInputField('social_media', 'whatsapp', sectionData.whatsapp, 'tel', '+5500000000000')}
            </div>
          </div>
        );
      
      case 'integrations':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="integrations-google_analytics_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Google Analytics ID
                </label>
                {renderInputField('integrations', 'google_analytics_id', sectionData.google_analytics_id, 'text', 'G-XXXXXXXXXX')}
              </div>
              <div>
                <label htmlFor="integrations-google_tag_manager_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Google Tag Manager ID
                </label>
                {renderInputField('integrations', 'google_tag_manager_id', sectionData.google_tag_manager_id, 'text', 'GTM-XXXXXXX')}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="integrations-facebook_pixel_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook Pixel ID
                </label>
                {renderInputField('integrations', 'facebook_pixel_id', sectionData.facebook_pixel_id, 'text', '123456789012345')}
              </div>
              <div>
                <label htmlFor="integrations-gemini_api_key" className="block text-sm font-medium text-gray-700 mb-1">
                  Gemini API Key
                </label>
                {renderInputField('integrations', 'gemini_api_key', sectionData.gemini_api_key, 'password', 'Sua chave API do Google Gemini')}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="integrations-recaptcha_site_key" className="block text-sm font-medium text-gray-700 mb-1">
                  reCAPTCHA Site Key
                </label>
                {renderInputField('integrations', 'recaptcha_site_key', sectionData.recaptcha_site_key, 'text', '6Lc...')}
              </div>
              <div>
                <label htmlFor="integrations-recaptcha_secret_key" className="block text-sm font-medium text-gray-700 mb-1">
                  reCAPTCHA Secret Key
                </label>
                {renderInputField('integrations', 'recaptcha_secret_key', sectionData.recaptcha_secret_key, 'password', '6Lc...')}
              </div>
            </div>
          </div>
        );
      
      case 'theme':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="theme-primary_color" className="block text-sm font-medium text-gray-700 mb-1">
                  Cor Primária
                </label>
                {renderInputField('theme', 'primary_color', sectionData.primary_color, 'color')}
              </div>
              <div>
                <label htmlFor="theme-secondary_color" className="block text-sm font-medium text-gray-700 mb-1">
                  Cor Secundária
                </label>
                {renderInputField('theme', 'secondary_color', sectionData.secondary_color, 'color')}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="theme-accent_color" className="block text-sm font-medium text-gray-700 mb-1">
                  Cor de Destaque
                </label>
                {renderInputField('theme', 'accent_color', sectionData.accent_color, 'color')}
              </div>
              <div>
                <label htmlFor="theme-background_color" className="block text-sm font-medium text-gray-700 mb-1">
                  Cor de Fundo
                </label>
                {renderInputField('theme', 'background_color', sectionData.background_color, 'color')}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="theme-text_color" className="block text-sm font-medium text-gray-700 mb-1">
                  Cor do Texto
                </label>
                {renderInputField('theme', 'text_color', sectionData.text_color, 'color')}
              </div>
              <div>
                <label htmlFor="theme-font_family" className="block text-sm font-medium text-gray-700 mb-1">
                  Família da Fonte
                </label>
                {renderInputField('theme', 'font_family', sectionData.font_family, 'text', 'Ex: Inter, Arial, sans-serif')}
              </div>
            </div>
            <div>
              <label htmlFor="theme-font_size" className="block text-sm font-medium text-gray-700 mb-1">
                Tamanho da Fonte
              </label>
              {renderInputField('theme', 'font_size', sectionData.font_size, 'text', 'Ex: 16px, 1rem')}
            </div>
          </div>
        );
      
      case 'seo':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="seo-meta_title" className="block text-sm font-medium text-gray-700 mb-1">
                Meta Título
              </label>
              {renderInputField('seo', 'meta_title', sectionData.meta_title, 'text', 'Título do site (máx. 60 caracteres)')}
              <p className="mt-1 text-xs text-gray-500">
                {sectionData.meta_title?.length || 0}/60 caracteres
              </p>
            </div>
            <div>
              <label htmlFor="seo-meta_description" className="block text-sm font-medium text-gray-700 mb-1">
                Meta Descrição
              </label>
              {renderInputField('seo', 'meta_description', sectionData.meta_description, 'textarea', 'Descrição do site (máx. 160 caracteres)', { rows: 3 })}
              <p className="mt-1 text-xs text-gray-500">
                {sectionData.meta_description?.length || 0}/160 caracteres
              </p>
            </div>
            <div>
              <label htmlFor="seo-meta_keywords" className="block text-sm font-medium text-gray-700 mb-1">
                Palavras-chave
              </label>
              {renderInputField('seo', 'meta_keywords', sectionData.meta_keywords, 'text', 'seo, palavras-chave, separadas por vírgula')}
            </div>
            <div>
              <label htmlFor="seo-canonical_url" className="block text-sm font-medium text-gray-700 mb-1">
                URL Canônica
              </label>
              {renderInputField('seo', 'canonical_url', sectionData.canonical_url, 'url', 'https://seusite.com')}
            </div>
            <div>
              <label htmlFor="seo-sitemap_enabled" className="block text-sm font-medium text-gray-700 mb-1">
                Sitemap
              </label>
              {renderInputField('seo', 'sitemap_enabled', sectionData.sitemap_enabled, 'checkbox', '', { label: 'Ativar sitemap XML' })}
            </div>
            <div>
              <label htmlFor="seo-robots_txt" className="block text-sm font-medium text-gray-700 mb-1">
                Robots.txt
              </label>
              {renderInputField('seo', 'robots_txt', sectionData.robots_txt, 'textarea', 'Conteúdo do arquivo robots.txt', { rows: 5 })}
            </div>
          </div>
        );
      
      case 'maintenance':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="maintenance-enabled" className="block text-sm font-medium text-gray-700 mb-1">
                Modo de Manutenção
              </label>
              {renderInputField('maintenance', 'enabled', sectionData.enabled, 'checkbox', '', { label: 'Ativar modo de manutenção' })}
            </div>
            {sectionData.enabled && (
              <>
                <div>
                  <label htmlFor="maintenance-message" className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem de Manutenção
                  </label>
                  {renderInputField('maintenance', 'message', sectionData.message, 'textarea', 'Mensagem exibida para os visitantes', { rows: 3 })}
                </div>
                <div>
                  <label htmlFor="maintenance-allowed_ips" className="block text-sm font-medium text-gray-700 mb-1">
                    IPs Permitidos
                  </label>
                  {renderInputField('maintenance', 'allowed_ips', sectionData.allowed_ips, 'array', 'Separe os IPs por vírgula')}
                  <p className="mt-1 text-xs text-gray-500">
                    Estes IPs terão acesso normal ao site durante a manutenção
                  </p>
                </div>
                <div>
                  <label htmlFor="maintenance-scheduled_end" className="block text-sm font-medium text-gray-700 mb-1">
                    Término Agendado
                  </label>
                  {renderInputField('maintenance', 'scheduled_end', sectionData.scheduled_end, 'datetime-local')}
                </div>
              </>
            )}
          </div>
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
                onClick={saveSettings}
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
    </div>
  );
};

export default SettingsPage;