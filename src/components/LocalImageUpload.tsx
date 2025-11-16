import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';

interface LocalImageUploadProps {
  value?: string;
  onChange: (imageUrl: string | null) => void;
  className?: string;
  maxSizeInMB?: number;
}

const LocalImageUpload: React.FC<LocalImageUploadProps> = ({
  value,
  onChange,
  className = '',
  maxSizeInMB = 5
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = useMemo(() => [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'image/svg+xml', 'image/bmp', 'image/tiff', 'image/x-icon',
    'image/vnd.microsoft.icon', 'image/avif', 'image/heic', 'image/heif',
    'image/x-ms-bmp', 'image/x-bmp', 'image/x-bitmap', 'image/pjpeg',
    'image/apng', 'image/x-png', 'image/vnd.adobe.photoshop',
    'image/jxl', 'image/x-canon-cr2', 'image/x-nikon-nef'
  ], []);
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;




  const saveFileLocally = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer upload');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao salvar arquivo');
    }
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);

    const validationError = !allowedTypes.includes(file.type)
      ? 'Tipo de arquivo não suportado. Use formatos de imagem válidos (JPG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO, AVIF, HEIC, etc.).'
      : file.size > maxSizeInBytes
        ? `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB.`
        : null;
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      const localUrl = await saveFileLocally(file);
      onChange(localUrl);
    } catch {
      setError('Erro ao salvar imagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [onChange, allowedTypes, maxSizeInBytes, maxSizeInMB]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleRemove = () => {
    onChange(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getImageSrc = (url: string) => {
    // Se for uma URL local, usar como está
    if (url.startsWith('/img/')) {
      return url;
    }
    // Se for base64 ou outra URL, usar como está
    return url;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      {!value && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
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
              <span> ou arraste uma imagem aqui</span>
            </div>
            
            <div className="text-xs text-gray-500">
              Todos os formatos de imagem (JPG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO, AVIF, HEIC, etc.) - máx. {maxSizeInMB}MB
            </div>
            
            <div className="text-xs text-blue-500 font-medium">
              Arquivo será salvo em /img/
            </div>
          </div>
        </div>
      )}

      {/* Preview Area */}
      {value && (
        <div className="relative">
          <div className="relative inline-block">
            <img
              src={getImageSrc(value)}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
              onError={() => {
                setError('Erro ao carregar imagem');
              }}
            />
            
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
              title="Remover imagem"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-2 space-y-1">
            <button
              onClick={openFileDialog}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium block"
            >
              Alterar imagem
            </button>
            
            <div className="text-xs text-gray-500">
              URL: {value}
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default LocalImageUpload;