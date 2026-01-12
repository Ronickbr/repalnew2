import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SiteSettings } from './SettingsManager';

interface SettingsModalProps {
  show: boolean;
  onClose: () => void;
  settings: SiteSettings;
  onSave: (settings: SiteSettings) => void;
  onChange: (settings: SiteSettings) => void;
  loading: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  show, 
  onClose, 
  settings, 
  onSave, 
  onChange, 
  loading 
}) => {
  const defaultSettings: SiteSettings = {
    site_name: '',
    site_description: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    site_url: '',
    google_analytics_id: '',
    google_tag_manager_id: '',
    facebook_pixel_id: '',
    instagram_account: '',
    cache_enabled: true,
    compress_images: true,
    lazy_loading: true,
    maintenance_mode: false,
    allow_robots: true,
    primary_color: '#dc2626',
    secondary_color: '#7c2d12'
  };

  const [formData, setFormData] = useState<SiteSettings>(() => ({
    ...defaultSettings,
    ...settings
  }));

  useEffect(() => {
    if (settings) {
      setFormData({ ...defaultSettings, ...settings });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: any) => {
    const newSettings = { ...formData, [field]: value };
    setFormData(newSettings);
    onChange(newSettings);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Editar Configurações do Site</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Gerais */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Site</label>
                  <input
                    type="text"
                    value={formData.site_name}
                    onChange={(e) => handleInputChange('site_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL do Site</label>
                  <input
                    type="url"
                    value={formData.site_url}
                    onChange={(e) => handleInputChange('site_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contato</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de Contato</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
                />
              </div>
            </div>

            {/* SEO */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Otimização SEO</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Título</label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => handleInputChange('meta_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Descrição</label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => handleInputChange('meta_description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave</label>
                  <input
                    type="text"
                    value={formData.meta_keywords}
                    onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="palavra1, palavra2, palavra3"
                  />
                </div>
              </div>
            </div>

            {/* Integrações */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Integrações</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
                  <input
                    type="text"
                    value={formData.google_analytics_id}
                    onChange={(e) => handleInputChange('google_analytics_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Tag Manager ID</label>
                  <input
                    type="text"
                    value={formData.google_tag_manager_id}
                    onChange={(e) => handleInputChange('google_tag_manager_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="GTM-XXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
                  <input
                    type="text"
                    value={formData.facebook_pixel_id}
                    onChange={(e) => handleInputChange('facebook_pixel_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="123456789012345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conta do Instagram</label>
                  <input
                    type="text"
                    value={formData.instagram_account}
                    onChange={(e) => handleInputChange('instagram_account', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="@usuario"
                  />
                </div>
              </div>
            </div>

            {/* Configurações de Performance */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.cache_enabled}
                    onChange={(e) => handleInputChange('cache_enabled', e.target.checked)}
                    className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Cache Ativado</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.compress_images}
                    onChange={(e) => handleInputChange('compress_images', e.target.checked)}
                    className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Compressão de Imagens</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.lazy_loading}
                    onChange={(e) => handleInputChange('lazy_loading', e.target.checked)}
                    className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Lazy Loading</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.maintenance_mode}
                    onChange={(e) => handleInputChange('maintenance_mode', e.target.checked)}
                    className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Modo de Manutenção</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allow_robots}
                    onChange={(e) => handleInputChange('allow_robots', e.target.checked)}
                    className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Permitir Robôs</span>
                </label>
              </div>
            </div>

            {/* Personalização */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personalização</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Primária</label>
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Secundária</label>
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </form>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;