import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (imageData: string | null) => void;
  className?: string;
  maxSizeInMB?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  className = '',
  maxSizeInMB = 5
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = useMemo(() => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'], []);
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;


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

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);

    const validationError = !allowedTypes.includes(file.type)
      ? 'Tipo de arquivo não suportado. Use apenas JPG, PNG, GIF ou WebP.'
      : file.size > maxSizeInBytes
        ? `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB.`
        : null;
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      const base64Data = await convertToBase64(file);
      onChange(base64Data);
    } catch {
      setError('Erro ao processar imagem. Tente novamente.');
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
              JPG, PNG, GIF ou WebP (máx. {maxSizeInMB}MB)
            </div>
          </div>
        </div>
      )}

      {/* Preview Area */}
      {value && (
        <div className="relative">
          <div className="relative inline-block">
            <img
              src={value}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
              onError={() => {
                setError('Erro ao carregar imagem');
                onChange(null);
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
          
          <div className="mt-2">
            <button
              onClick={openFileDialog}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Alterar imagem
            </button>
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

export default ImageUpload;