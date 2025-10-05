import React, { useState } from 'react';
import { Plus, X, AlertCircle, CheckCircle } from 'lucide-react';

interface ImageUrlInputProps {
  placeholder?: string;
  onChange: (urls: string[]) => void;
  showPreview?: boolean;
  maxUrls?: number;
  initialUrls?: string[];
}

interface UrlState {
  id: string;
  url: string;
  isValid: boolean;
  isLoading: boolean;
  error: string;
  previewUrl: string;
}

const ImageUrlInput: React.FC<ImageUrlInputProps> = ({
  placeholder = "Cole a URL da imagem aqui",
  onChange,
  showPreview = true,
  maxUrls = 5,
  initialUrls = []
}) => {
  const [urlStates, setUrlStates] = useState<UrlState[]>(() => {
    if (initialUrls.length > 0) {
      return initialUrls.map((url, index) => ({
        id: `url-${index}`,
        url,
        isValid: true,
        isLoading: false,
        error: '',
        previewUrl: url
      }));
    }
    return [{
      id: 'url-0',
      url: '',
      isValid: false,
      isLoading: false,
      error: '',
      previewUrl: ''
    }];
  });

  const validateImageUrl = async (url: string): Promise<{ isValid: boolean; error: string }> => {
    if (!url.trim()) {
      return { isValid: false, error: '' };
    }

    // Validação básica de URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return { isValid: false, error: 'URL inválida' };
    }

    // Verificar se é uma extensão de imagem válida
    // Extrair o pathname sem parâmetros de query
    const pathname = parsedUrl.pathname.toLowerCase();
    const imageExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.bmp', '.tiff', '.tif', '.ico', '.avif', '.heic', 
      '.heif', '.jfif', '.pjpeg', '.pjp', '.apng'
    ];
    
    // Verificar se o pathname contém uma extensão de imagem
    const hasValidExtension = imageExtensions.some(ext => pathname.includes(ext));

    // Função para testar se a imagem carrega no navegador
    const testImageLoad = (testUrl: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = testUrl;
        
        // Timeout de 10 segundos
        setTimeout(() => resolve(false), 10000);
      });
    };

    // Se tem extensão válida, primeiro testar se a imagem carrega diretamente
    if (hasValidExtension) {
      const canLoadDirectly = await testImageLoad(url);
      if (canLoadDirectly) {
        return { isValid: true, error: '' };
      }
      
      // Se não conseguiu carregar diretamente, pode ser problema de CORS
      // Vamos tentar validar via fetch com diferentes estratégias
      try {
        // Primeira tentativa: fetch normal
        const response = await fetch(url, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.ok) {
          // Se o fetch funcionou mas a imagem não carregou, é problema de CORS
          return { 
            isValid: true, 
            error: 'Aviso: Esta imagem pode ter problemas de CORS, mas será aceita' 
          };
        }
      } catch (fetchError) {
        // Se o fetch falhou, mas temos extensão válida, vamos aceitar com aviso
        console.warn('Fetch failed for image URL:', url, fetchError);
        return { 
          isValid: true, 
          error: 'Aviso: Não foi possível verificar a imagem, mas será aceita pela extensão válida' 
        };
      }
    }

    // Se não tem extensão válida no pathname, vamos tentar verificar via Content-Type
    if (!hasValidExtension) {
      // Para URLs sem extensão clara (como CDNs), vamos verificar o Content-Type
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!response.ok) {
          return { isValid: false, error: 'Imagem não acessível' };
        }

        const contentType = response.headers.get('content-type');
        const validImageTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
          'image/svg+xml', 'image/bmp', 'image/tiff', 'image/x-icon', 
          'image/vnd.microsoft.icon', 'image/avif', 'image/heic', 'image/heif',
          'image/x-ms-bmp', 'image/x-bmp', 'image/x-bitmap', 'image/pjpeg',
          'image/apng', 'image/x-png'
        ];
        
        if (!contentType || (!contentType.startsWith('image/') && !validImageTypes.some(type => contentType.includes(type)))) {
          return { isValid: false, error: 'URL não aponta para uma imagem válida' };
        }

        // Testar se a imagem carrega no navegador
        const canLoadDirectly = await testImageLoad(url);
        if (canLoadDirectly) {
          return { isValid: true, error: '' };
        } else {
          return { 
            isValid: true, 
            error: 'Aviso: Esta imagem pode ter problemas de CORS, mas será aceita' 
          };
        }
      } catch {
        return { isValid: false, error: 'Erro ao verificar a imagem' };
      }
    }

    // Fallback: se chegou até aqui, a URL não é válida
    return { isValid: false, error: 'URL não é uma imagem válida' };
  };

  const handleUrlChange = async (id: string, newUrl: string) => {
    // Primeiro, preparar o estado com loading enquanto valida
    let nextStates = urlStates.map(state => 
      state.id === id 
        ? { ...state, url: newUrl, isLoading: true, error: '', isValid: false, previewUrl: '' }
        : state
    );

    // Se não há URL, finalize o estado e envie mudança vazia ou URLs válidas restantes
    if (!newUrl.trim()) {
      nextStates = nextStates.map(state => 
        state.id === id 
          ? { ...state, isLoading: false, isValid: false, error: '', previewUrl: '' }
          : state
      );
      setUrlStates(nextStates);
      const validUrlsEmpty = nextStates
        .filter(s => s.url.trim() && s.isValid)
        .map(s => s.url);
      onChange(validUrlsEmpty);
      return;
    }

    // Validar URL e atualizar o estado com base no resultado
    const validation = await validateImageUrl(newUrl);
    nextStates = nextStates.map(state => 
      state.id === id 
        ? { 
            ...state, 
            isLoading: false, 
            isValid: validation.isValid,
            error: validation.error,
            previewUrl: validation.isValid ? newUrl : ''
          }
        : state
    );

    setUrlStates(nextStates);

    // Notificar mudanças com base no estado atualizado
    const validUrls = nextStates
      .filter(s => s.url.trim() && s.isValid)
      .map(s => s.url);
    onChange(validUrls);
  };

  const addUrlField = () => {
    if (urlStates.length < maxUrls) {
      const newId = `url-${Date.now()}`;
      setUrlStates(prev => [...prev, {
        id: newId,
        url: '',
        isValid: false,
        isLoading: false,
        error: '',
        previewUrl: ''
      }]);
    }
  };

  const removeUrlField = (id: string) => {
    if (urlStates.length > 1) {
      const nextStates = urlStates.filter(state => state.id !== id);
      setUrlStates(nextStates);
      
      // Atualizar URLs válidas com base no novo estado
      const validUrls = nextStates
        .filter(state => state.url.trim() && state.isValid)
        .map(state => state.url);
      onChange(validUrls);
    }
  };

  return (
    <div className="space-y-4">
      {urlStates.map((urlState, index) => (
        <div key={urlState.id} className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="url"
                  value={urlState.url}
                  onChange={(e) => handleUrlChange(urlState.id, e.target.value)}
                  placeholder={`${placeholder} ${index + 1}`}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 pr-10 ${
                    urlState.url && !urlState.isLoading
                      ? urlState.isValid
                        ? 'border-green-300 focus:ring-green-500'
                        : 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                
                {/* Ícone de status */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {urlState.isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  ) : urlState.url ? (
                    urlState.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )
                  ) : null}
                </div>
              </div>
              
              {/* Mensagem de erro */}
              {urlState.error && (
                <p className="text-sm text-red-600 mt-1">{urlState.error}</p>
              )}
            </div>

            {/* Botão de remover */}
            {urlStates.length > 1 && (
              <button
                type="button"
                onClick={() => removeUrlField(urlState.id)}
                className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                title="Remover URL"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Preview da imagem */}
          {showPreview && urlState.previewUrl && urlState.isValid && (
            <div className="mt-2">
              <img
                src={urlState.previewUrl}
                alt="Preview da imagem"
                className="max-w-32 max-h-32 object-cover rounded-md border border-gray-200"
                onError={() => {
                  setUrlStates(prev => prev.map(state => 
                    state.id === urlState.id 
                      ? { ...state, isValid: false, error: 'Erro ao carregar a imagem', previewUrl: '' }
                      : state
                  ));
                }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Botão de adicionar nova URL */}
      {urlStates.length < maxUrls && (
        <button
          type="button"
          onClick={addUrlField}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors border border-dashed border-blue-300 hover:border-blue-400 w-full justify-center"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar outra URL de imagem</span>
        </button>
      )}

      {/* Informação sobre limite */}
      {urlStates.length >= maxUrls && (
        <p className="text-sm text-amber-600">
          Limite máximo de {maxUrls} URLs atingido.
        </p>
      )}
    </div>
  );
};

export default ImageUrlInput;