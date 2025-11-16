import React, { useState, useRef } from 'react';
import { Upload, X, Link, UploadCloud, GripVertical, Image as ImageIcon, Star } from 'lucide-react';

interface ImageItem {
  id: string;
  url: string;
  type: 'file' | 'url';
  file?: File;
}

interface UnifiedImageUploadProps {
  images: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
  maxImages?: number;
  maxSizeInMB?: number;
  className?: string;
}

const UnifiedImageUpload: React.FC<UnifiedImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  maxSizeInMB = 5,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use apenas JPG, PNG, GIF ou WebP.';
    }
    
    if (file.size > maxSizeInBytes) {
      return `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB.`;
    }
    
    return null;
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Erro ao converter arquivo'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList) => {
    if (images.length >= maxImages) {
      setError(`Máximo de ${maxImages} imagens permitidas`);
      return;
    }

    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    setError(null);
    setIsLoading(true);

    try {
      const newImages: ImageItem[] = [];
      
      for (const file of filesToProcess) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        const base64Data = await convertToBase64(file);
        newImages.push({
          id: generateId(),
          url: base64Data,
          type: 'file',
          file
        });
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      setError('Erro ao processar imagens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      setError('Por favor, insira uma URL válida');
      return;
    }

    if (images.length >= maxImages) {
      setError(`Máximo de ${maxImages} imagens permitidas`);
      return;
    }

    try {
      new URL(urlInput.trim());
      const newImage: ImageItem = {
        id: generateId(),
        url: urlInput.trim(),
        type: 'url'
      };
      
      onImagesChange([...images, newImage]);
      setUrlInput('');
      setError(null);
    } catch {
      setError('URL inválida. Por favor, insira uma URL válida');
    }
  };

  const removeImage = (id: string) => {
    const newImages = images.filter(img => img.id !== id);
    onImagesChange(newImages);
    setError(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    onImagesChange(newImages);
    setDraggedIndex(null);
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && activeTab === 'file') {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (activeTab === 'file') {
      setIsDragging(true);
    }
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Counter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Imagens do Produto</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {images.length}/{maxImages}
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setActiveTab('file')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'file'
              ? 'bg-blue-100 text-blue-700 border-r border-blue-200'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          Arquivo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'url'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Link className="h-4 w-4" />
          URL
        </button>
      </div>

      {/* Upload Area */}
      {images.length < maxImages && (
        <div className="space-y-3">
          {activeTab === 'file' && (
            <div
              onDrop={handleFileDrop}
              onDragOver={handleFileDragOver}
              onDragLeave={handleFileDragLeave}
              onClick={openFileDialog}
              className={`
                relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
                ${isDragging 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }
                ${isLoading ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={allowedTypes.join(',')}
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="flex flex-col items-center space-y-2">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
                
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600">Clique para selecionar</span>
                  <span> ou arraste as imagens aqui</span>
                </div>
                
                <div className="text-xs text-gray-500">
                  JPG, PNG, GIF ou WebP (máx. {maxSizeInMB}MB cada)
                </div>
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Cole a URL da imagem aqui"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                Adicionar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
          <Upload className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`relative group border-2 rounded-lg overflow-hidden transition-all ${
                  draggedIndex === index ? 'opacity-50' : ''
                } ${
                  index === 0 ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleImageDrop(e, index)}
                onDragOver={handleImageDragOver}
              >
                {/* Main Image Indicator */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Principal
                  </div>
                )}
                
                {/* Drag Handle */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-white bg-black bg-opacity-50 rounded cursor-move" />
                </div>
                
                {/* Image */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => {
                        setError(`Erro ao carregar imagem ${index + 1}`);
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                {/* Remove Button */}
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute bottom-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  type="button"
                >
                  <X className="w-3 h-3" />
                </button>
                
                {/* Image Type Indicator */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                  {image.type === 'url' ? 'URL' : 'FILE'}
                </div>
              </div>
            ))}
          </div>
          
          {/* Instructions */}
          <div className="text-sm text-gray-500 text-center space-y-1">
            <p>Arraste as imagens para reordenar • A primeira imagem será a principal</p>
            <p className="text-xs">Máximo {maxImages} imagens • Cada imagem deve ter no máximo {maxSizeInMB}MB</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedImageUpload;
export type { ImageItem };