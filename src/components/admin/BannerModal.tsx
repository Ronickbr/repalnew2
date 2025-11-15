import React, { useRef } from 'react';
import { X, Save, Upload, Link, FileImage, Image as ImageIcon } from 'lucide-react';
import { Banner } from '../../hooks/useBanners';

interface BannerModalProps {
  isOpen: boolean;
  editingBanner: Banner | null;
  bannerForm: {
    title: string;
    image_url: string;
    link_url?: string;
    active?: boolean;
    sort_order?: number;
  };
  bannerError: string | null;
  formLoading: boolean;
  imageMethod: 'url' | 'upload';
  selectedFile: File | null;
  uploadingImage: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onFormChange: (field: string, value: any) => void;
  onImageMethodChange: (method: 'url' | 'upload') => void;
  onFileSelect: (file: File) => void;
}

const BannerModal: React.FC<BannerModalProps> = ({
  isOpen,
  editingBanner,
  bannerForm,
  bannerError,
  formLoading,
  imageMethod,
  selectedFile,
  uploadingImage,
  onClose,
  onSubmit,
  onFormChange,
  onImageMethodChange,
  onFileSelect
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingBanner ? 'Editar Banner' : 'Novo Banner'}
            </h2>
            <button
              onClick={onClose}
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

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                value={bannerForm.title}
                onChange={(e) => onFormChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
                placeholder="Título do banner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagem do Banner *
              </label>
              
              {/* Seleção de método da imagem */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
                <button
                  type="button"
                  onClick={() => onImageMethodChange('url')}
                  className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    imageMethod === 'url'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  aria-label="Usar URL para imagem"
                  disabled={formLoading}
                >
                  <Link className="h-4 w-4 mr-2" />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => onImageMethodChange('upload')}
                  className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    imageMethod === 'upload'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  aria-label="Fazer upload de imagem"
                  disabled={formLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </button>
              </div>

              {/* Campo URL */}
              {imageMethod === 'url' && (
                <div>
                  <input
                    type="url"
                    value={bannerForm.image_url || ''}
                    onChange={(e) => onFormChange('image_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                    placeholder="https://exemplo.com/imagem.jpg"
                    disabled={formLoading}
                  />
                </div>
              )}

              {/* Campo Upload */}
              {imageMethod === 'upload' && (
                <div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onFileSelect(file);
                      }}
                      className="hidden"
                      id="banner-file-input"
                      disabled={formLoading || uploadingImage}
                    />
                    <label
                      htmlFor="banner-file-input"
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
                  {uploadingImage && (
                    <div className="mt-2 flex items-center text-sm text-red-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                      Fazendo upload...
                    </div>
                  )}
                </div>
              )}

              {/* Preview da imagem */}
              {(bannerForm.image_url || selectedFile) && (
                <div className="mt-2">
                  <img
                    src={imageMethod === 'url' ? bannerForm.image_url : (selectedFile ? URL.createObjectURL(selectedFile) : '')}
                    alt="Preview do banner"
                    className="w-full h-32 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const errorDiv = e.currentTarget.nextElementSibling;
                      if (errorDiv) {
                        (errorDiv as HTMLElement).classList.remove('hidden');
                      }
                    }}
                  />
                  <div className="hidden text-center text-gray-500 py-4">
                    <ImageIcon className="h-16 w-16 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Não foi possível carregar a imagem</p>
                    <p className="text-xs">
                      {imageMethod === 'url' ? 'Verifique se a URL está correta' : 'Verifique o arquivo selecionado'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL do Link
              </label>
              <input
                type="url"
                value={bannerForm.link_url || ''}
                onChange={(e) => onFormChange('link_url', e.target.value)}
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
                  value={bannerForm.sort_order || 1}
                  onChange={(e) => onFormChange('sort_order', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  min="1"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bannerForm.active ?? true}
                    onChange={(e) => onFormChange('active', e.target.checked)}
                    className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Banner Ativo</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
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
  );
};

export default BannerModal;