/**
 * Utilitário de validação e upload de imagens para produtos
 * Implementa políticas de upload idênticas às utilizadas para banners e marcas
 */

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: ImageMetadata;
}

export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  type: string;
  mimeType: string;
  aspectRatio: number;
  hasTransparency: boolean;
  colorSpace: string;
}

export interface UploadConfig {
  maxFileSize: number; // em bytes
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  allowedFormats: string[];
  allowedMimeTypes: string[];
  recommendedAspectRatio?: number;
  aspectRatioTolerance?: number;
}

// Configuração padrão para imagens de produtos
export const PRODUCT_IMAGE_CONFIG: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  minWidth: 300,
  maxWidth: 4000,
  minHeight: 300,
  maxHeight: 4000,
  allowedFormats: ['jpeg', 'jpg', 'png', 'webp', 'gif'],
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ],
  recommendedAspectRatio: 1.0, // Quadrado (1:1) para imagens principais
  aspectRatioTolerance: 0.2 // 20% de tolerância
};

// Configuração para imagens adicionais (mais flexível)
export const ADDITIONAL_IMAGE_CONFIG: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  minWidth: 200,
  maxWidth: 4000,
  minHeight: 200,
  maxHeight: 4000,
  allowedFormats: ['jpeg', 'jpg', 'png', 'webp', 'gif'],
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/webp',
    'image/gif'
  ],
  recommendedAspectRatio: 1.33, // 4:3 para imagens adicionais
  aspectRatioTolerance: 0.5 // 50% de tolerância
};

/**
 * Valida um arquivo de imagem antes do upload
 */
export async function validateImageFile(file: File, config: UploadConfig = PRODUCT_IMAGE_CONFIG): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let metadata: ImageMetadata | undefined;

  try {
    // Validação básica do arquivo
    if (!file) {
      errors.push('Nenhum arquivo selecionado');
      return { isValid: false, errors, warnings };
    }

    // Validação do tipo MIME
    if (!config.allowedMimeTypes.includes(file.type)) {
      errors.push(`Formato de arquivo não permitido. Formatos aceitos: ${config.allowedFormats.join(', ').toUpperCase()}`);
    }

    // Validação do tamanho do arquivo
    if (file.size > config.maxFileSize) {
      const maxSizeMB = (config.maxFileSize / (1024 * 1024)).toFixed(1);
      errors.push(`Arquivo muito grande. Tamanho máximo permitido: ${maxSizeMB}MB`);
    }

    // Validação de imagem vazia
    if (file.size === 0) {
      errors.push('Arquivo de imagem está vazio');
    }

    // Se houver erros básicos, não continuar com validação de imagem
    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // Carregar e validar a imagem
    const img = await loadImage(file);
    metadata = extractImageMetadata(img, file);

    // Validação de dimensões
    if (metadata.width < config.minWidth) {
      errors.push(`Largura mínima: ${config.minWidth}px (imagem tem ${metadata.width}px)`);
    }
    if (metadata.width > config.maxWidth) {
      errors.push(`Largura máxima: ${config.maxWidth}px (imagem tem ${metadata.width}px)`);
    }
    if (metadata.height < config.minHeight) {
      errors.push(`Altura mínima: ${config.minHeight}px (imagem tem ${metadata.height}px)`);
    }
    if (metadata.height > config.maxHeight) {
      errors.push(`Altura máxima: ${config.maxHeight}px (imagem tem ${metadata.height}px)`);
    }

    // Validação de proporção (aspect ratio)
    if (config.recommendedAspectRatio && config.aspectRatioTolerance) {
      const aspectRatioDiff = Math.abs(metadata.aspectRatio - config.recommendedAspectRatio);
      if (aspectRatioDiff > config.aspectRatioTolerance) {
        const recommended = config.recommendedAspectRatio.toFixed(2);
        const actual = metadata.aspectRatio.toFixed(2);
        warnings.push(`Proporção recomendada: ${recommended}:1 (imagem tem ${actual}:1)`);
      }
    }

    // Avisos adicionais
    if (file.size > 5 * 1024 * 1024) { // 5MB
      warnings.push('Imagem grande pode afetar o carregamento da página');
    }

    if (metadata.width > 2000 || metadata.height > 2000) {
      warnings.push('Imagem muito grande pode ser redimensionada automaticamente');
    }

  } catch (error) {
    console.error('Erro na validação de imagem:', error);
    errors.push('Erro ao processar imagem. Verifique se o arquivo não está corrompido.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata
  };
}

/**
 * Carrega uma imagem a partir de um arquivo
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Verificar se URL.createObjectURL está disponível (não está em alguns ambientes de teste)
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = objectUrl;
    } else {
      // Fallback para ambientes de teste - usar FileReader
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Extrai metadados de uma imagem
 */
function extractImageMetadata(img: HTMLImageElement, file: File): ImageMetadata {
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    size: file.size,
    type: file.type.split('/')[1],
    mimeType: file.type,
    aspectRatio: img.naturalWidth / img.naturalHeight,
    hasTransparency: file.type === 'image/png' || file.type === 'image/gif',
    colorSpace: 'sRGB' // Padrão para web
  };
}

/**
 * Sanitiza o nome do arquivo removendo caracteres especiais
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Remove caracteres especiais
    .replace(/_{2,}/g, '_') // Remove underscores múltiplos
    .toLowerCase();
}

/**
 * Gera um nome único para o arquivo
 */
export function generateUniqueFileName(originalName: string, prefix: string = 'product'): string {
  const sanitized = sanitizeFileName(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const ext = sanitized.split('.').pop() || 'jpg';
  
  return `${prefix}-${timestamp}-${random}.${ext}`;
}

/**
 * Verifica se um arquivo é potencialmente malicioso
 */
export function isPotentiallyMalicious(file: File): boolean {
  // Verificações básicas de segurança
  if (file.size === 0) return true;
  if (file.name.length > 255) return true;
  if (file.name.includes('..')) return true;
  if (file.name.startsWith('.')) return true;
  
  // Verificar extensão vs MIME type
  const ext = file.name.split('.').pop()?.toLowerCase();
  const mimeExt = file.type.split('/').pop()?.toLowerCase();
  
  if (ext && mimeExt && ext !== mimeExt) {
    // Verificar casos comuns de mismatch
    const validMismatches = [
      { ext: 'jpg', mime: 'jpeg' },
      { ext: 'jpeg', mime: 'jpg' }
    ];
    
    const isValidMismatch = validMismatches.some(m => 
      m.ext === ext && m.mime === mimeExt
    );
    
    if (!isValidMismatch) {
      return true;
    }
  }
  
  return false;
}

/**
 * Valida metadados EXIF (remove dados de GPS, etc.)
 */
export async function validateAndStripMetadata(file: File): Promise<File> {
  // Para implementação futura - strip EXIF data
  // Por enquanto, apenas retorna o arquivo original
  return file;
}

/**
 * Cria uma versão em miniatura da imagem
 */
export async function createThumbnail(file: File, maxWidth: number = 150, maxHeight: number = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas não suportado'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Calcular dimensões mantendo proporção
      let { width, height } = img;
      const aspectRatio = width / height;

      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      canvas.width = width;
      canvas.height = height;

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Converter para base64
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      
      URL.revokeObjectURL(objectUrl);
      resolve(thumbnail);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Erro ao criar miniatura'));
    };

    img.src = objectUrl;
  });
}