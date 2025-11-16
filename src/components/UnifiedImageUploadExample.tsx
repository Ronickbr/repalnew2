import React, { useState } from 'react';
import UnifiedImageUpload from './UnifiedImageUpload';

interface ImageItem {
  id: string;
  url: string;
  type: 'file' | 'url';
  file?: File;
}

const UnifiedImageUploadExample: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);

  const handleImagesChange = (newImages: ImageItem[]) => {
    setImages(newImages);
    console.log('Imagens atualizadas:', newImages);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Exemplo de Upload Unificado</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Upload de Imagens</h2>
          <p className="text-sm text-gray-600 mb-4">
            Este componente permite upload de até 5 imagens por arquivo ou URL, 
            com funcionalidade de arrastar para reordenar.
          </p>
          
          <UnifiedImageUpload
            images={images}
            onImagesChange={handleImagesChange}
            maxImages={5}
            maxSizeInMB={5}
          />
        </div>

        {/* Preview dos dados */}
        {images.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Dados das Imagens</h3>
            <div className="space-y-2">
              {images.map((image, index) => (
                <div key={image.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                  <span className={`text-sm font-medium ${
                    index === 0 ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {index === 0 ? 'Principal' : `Imagem ${index + 1}`}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {image.type === 'url' ? 'URL' : 'Arquivo'}
                  </span>
                  <span className="text-xs text-gray-600 truncate flex-1">
                    {image.url.substring(0, 50)}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedImageUploadExample;