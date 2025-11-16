import React, { useState } from 'react';
import UnifiedImageUpload from '../components/UnifiedImageUpload';

interface ImageItem {
  id: string;
  url: string;
  type: 'file' | 'url';
  file?: File;
}

const TestUnifiedUpload: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleImagesChange = (newImages: ImageItem[]) => {
    setImages(newImages);
    console.log('Imagens atualizadas:', newImages);
  };

  const handleSave = () => {
    console.log('Salvando imagens:', images);
    alert(`Imagens salvas com sucesso! Total: ${images.length}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teste - Upload Unificado</h1>
              <p className="text-gray-600 mt-2">
                Nova interface de upload de imagens com drag & drop
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {showPreview ? 'Ocultar' : 'Mostrar'} Preview
              </button>
              <button
                onClick={handleSave}
                disabled={images.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Salvar Imagens
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-blue-900 mb-4">
                  📸 Upload de Imagens
                </h2>
                <p className="text-sm text-blue-700 mb-4">
                  Teste o novo componente unificado que permite:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Upload por arquivo ou URL</li>
                  <li>• Arrastar para reordenar</li>
                  <li>• Limite de 5 imagens</li>
                  <li>• Validação automática</li>
                  <li>• Preview instantâneo</li>
                </ul>
              </div>

              <UnifiedImageUpload
                images={images}
                onImagesChange={handleImagesChange}
                maxImages={5}
                maxSizeInMB={5}
              />
            </div>

            <div className="space-y-6">
              {showPreview && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📋 Dados das Imagens ({images.length}/5)
                  </h3>
                  
                  {images.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">📷</div>
                      <p className="text-gray-500">Nenhuma imagem selecionada</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Use o upload ao lado para adicionar imagens
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {images.map((image, index) => (
                        <div key={image.id} className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {image.type === 'url' ? (
                                <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                                  <span className="text-blue-600 text-xs font-medium">URL</span>
                                </div>
                              ) : (
                                <img
                                  src={image.url}
                                  alt={`Preview ${index + 1}`}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium px-2 py-1 rounded ${
                                  index === 0 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {index === 0 ? 'Principal' : `Imagem ${index + 1}`}
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {image.type === 'url' ? 'URL' : 'Arquivo'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 truncate">
                                {image.url.substring(0, 50)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  ✅ Funcionalidades Implementadas
                </h3>
                <ul className="text-sm text-green-700 space-y-2">
                  <li>• Upload unificado (arquivo + URL)</li>
                  <li>• Sistema de abas intuitivo</li>
                  <li>• Drag & drop para reordenar</li>
                  <li>• Contador de imagens (X/5)</li>
                  <li>• Indicador de imagem principal</li>
                  <li>• Validação de formato e tamanho</li>
                  <li>• Preview de thumbnails</li>
                  <li>• Remoção individual</li>
                  <li>• Feedback visual completo</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                  🎯 Como Testar
                </h3>
                <ol className="text-sm text-yellow-700 space-y-1">
                  <li>1. Clique na aba "Arquivo" ou "URL"</li>
                  <li>2. Faça upload de imagens (máx. 5MB)</li>
                  <li>3. Arraste para reordenar</li>
                  <li>4. A primeira posição é a principal</li>
                  <li>5. Clique em "Salvar Imagens"</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestUnifiedUpload;