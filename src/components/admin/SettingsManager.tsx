import { useState } from 'react';
import { Settings, Globe, Code, BarChart3, Facebook, Eye, EyeOff, Copy, Check } from 'lucide-react';

export interface SiteSettings {
  // Informações Gerais
  site_name?: string;
  site_description?: string;
  site_url?: string;
  company_name?: string;
  
  // SEO Avançado
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  meta_robots?: string;
  canonical_url?: string;
  schema_markup?: string;
  
  // Google & Analytics
  google_analytics_id?: string;
  google_tag_manager_id?: string;
  google_search_console_id?: string;
  
  // Facebook & Social
  facebook_pixel_id?: string;
  facebook_app_id?: string;
  instagram_account?: string;
  whatsapp_number?: string;
  
  // APIs e Integrações
  google_maps_api_key?: string;
  recaptcha_site_key?: string;
  recaptcha_secret_key?: string;
  
  // Contato
  contact_email?: string;
  contact_phone?: string;
  contact_cellphone?: string;
  address?: string;
  business_hours?: string;
  
  // Configurações Avançadas
  maintenance_mode?: boolean;
  allow_robots?: boolean;
  cache_enabled?: boolean;
  compress_images?: boolean;
  lazy_loading?: boolean;
  
  // Personalização
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  favicon_url?: string;
}

interface SettingsManagerProps {
  siteSettings: SiteSettings;
  onEditSettings: () => void;
}

export default function SettingsManager({ siteSettings, onEditSettings }: SettingsManagerProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'seo' | 'analytics' | 'social' | 'apis' | 'advanced'>('general');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const tabs = [
    { id: 'general', label: 'Geral', icon: Globe },
    { id: 'seo', label: 'SEO', icon: Code },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'social', label: 'Social', icon: Facebook },
    { id: 'apis', label: 'APIs', icon: Code },
    { id: 'advanced', label: 'Avançado', icon: Settings }
  ];

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const renderField = (label: string, value: string | undefined, fieldKey: string, type: 'text' | 'textarea' | 'color' = 'text') => {
    const displayValue = value || 'Não configurado';
    const isConfigured = !!value;

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center space-x-2">
          {type === 'textarea' ? (
            <textarea
              value={displayValue}
              readOnly
              className={`flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm resize-none ${
                isConfigured ? 'text-gray-900' : 'text-gray-500 italic'
              }`}
              rows={3}
            />
          ) : type === 'color' ? (
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded border border-gray-300"
                style={{ backgroundColor: value || '#ffffff' }}
              />
              <span className={`text-sm ${isConfigured ? 'text-gray-900' : 'text-gray-500 italic'}`}>
                {displayValue}
              </span>
            </div>
          ) : (
            <input
              type="text"
              value={displayValue}
              readOnly
              className={`flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm ${
                isConfigured ? 'text-gray-900' : 'text-gray-500 italic'
              }`}
            />
          )}
          {isConfigured && (
            <button
              onClick={() => copyToClipboard(value!, fieldKey)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Copiar"
            >
              {copiedField === fieldKey ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderBooleanField = (label: string, value: boolean | undefined) => {
    const isEnabled = !!value;

    return (
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
          isEnabled 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          <span>{isEnabled ? 'Ativado' : 'Desativado'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Configurações do Site</h2>
        <button 
          onClick={onEditSettings}
          className="bg-red-900 hover:bg-red-800 text-white px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center space-x-2 text-sm sm:text-base"
        >
          <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Editar Configurações</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-red-900 text-red-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Informações Gerais</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {renderField('Nome do Site', siteSettings.site_name, 'site_name')}
                  {renderField('Nome da Empresa', siteSettings.company_name, 'company_name')}
                  {renderField('URL do Site', siteSettings.site_url, 'site_url')}
                  {renderField('Descrição', siteSettings.site_description, 'site_description', 'textarea')}
                  {renderField('Logo URL', siteSettings.logo_url, 'logo_url')}
                  {renderField('Favicon URL', siteSettings.favicon_url, 'favicon_url')}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cores do Tema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField('Cor Primária', siteSettings.primary_color, 'primary_color', 'color')}
                  {renderField('Cor Secundária', siteSettings.secondary_color, 'secondary_color', 'color')}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Exibição</h3>
                <div className="space-y-4">
                  {renderBooleanField('Modo de Manutenção', siteSettings.maintenance_mode)}
                  {renderBooleanField('Permitir Robôs', siteSettings.allow_robots)}
                  {renderBooleanField('Cache Ativado', siteSettings.cache_enabled)}
                  {renderBooleanField('Compressão de Imagens', siteSettings.compress_images)}
                  {renderBooleanField('Lazy Loading', siteSettings.lazy_loading)}
                </div>
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Meta Tags</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField('Meta Title', siteSettings.meta_title, 'meta_title')}
                  {renderField('Meta Description', siteSettings.meta_description, 'meta_description', 'textarea')}
                  {renderField('Meta Keywords', siteSettings.meta_keywords, 'meta_keywords', 'textarea')}
                  {renderField('Meta Robots', siteSettings.meta_robots, 'meta_robots')}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">URLs e Canonical</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField('URL Canonical', siteSettings.canonical_url, 'canonical_url')}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Schema Markup</h3>
                {renderField('Schema JSON-LD', siteSettings.schema_markup, 'schema_markup', 'textarea')}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Google Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField('Google Analytics ID', siteSettings.google_analytics_id, 'google_analytics_id')}
                  {renderField('Google Tag Manager ID', siteSettings.google_tag_manager_id, 'google_tag_manager_id')}
                  {renderField('Google Search Console ID', siteSettings.google_search_console_id, 'google_search_console_id')}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">📊 Dicas de Analytics</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use Google Analytics 4 (GA4) para métricas modernas</li>
                  <li>• Google Tag Manager facilita o gerenciamento de tags</li>
                  <li>• Search Console ajuda no SEO e indexação</li>
                </ul>
              </div>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Facebook & Instagram</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField('Facebook Pixel ID', siteSettings.facebook_pixel_id, 'facebook_pixel_id')}
                  {renderField('Facebook App ID', siteSettings.facebook_app_id, 'facebook_app_id')}
                  {renderField('Instagram Account', siteSettings.instagram_account, 'instagram_account')}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">WhatsApp</h3>
                {renderField('Número WhatsApp', siteSettings.whatsapp_number, 'whatsapp_number')}
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-purple-900 mb-2">📱 Dicas de Marketing</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Facebook Pixel rastreia conversões e públicos</li>
                  <li>• WhatsApp Business API para automação</li>
                  <li>• Instagram Shopping para vendas diretas</li>
                </ul>
              </div>
            </div>
          )}

          {/* APIs Tab */}
          {activeTab === 'apis' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Google APIs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField('Google Maps API Key', siteSettings.google_maps_api_key, 'google_maps_api_key')}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Segurança</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField('reCAPTCHA Site Key', siteSettings.recaptcha_site_key, 'recaptcha_site_key')}
                  {renderField('reCAPTCHA Secret Key', siteSettings.recaptcha_secret_key, 'recaptcha_secret_key')}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">🔐 Segurança de APIs</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Mantenhas suas chaves de API seguras</li>
                  <li>• Configure domínios autorizados</li>
                  <li>• Use reCAPTCHA v3 para melhor segurança</li>
                </ul>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações de Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField('Email de Contato', siteSettings.contact_email, 'contact_email')}
                  {renderField('Telefone Fixo', siteSettings.contact_phone, 'contact_phone')}
                  {renderField('Telefone Celular', siteSettings.contact_cellphone, 'contact_cellphone')}
                  {renderField('Horário de Funcionamento', siteSettings.business_hours, 'business_hours')}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
                {renderField('Endereço Completo', siteSettings.address, 'address', 'textarea')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}