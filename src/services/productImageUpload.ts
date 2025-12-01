/**
 * Serviço de upload de imagens para produtos
 * Implementa políticas de upload com validação técnica e segurança
 */

import { supabase } from '../lib/supabase';
import { 
  validateImageFile, 
  generateUniqueFileName, 
  isPotentiallyMalicious,
  PRODUCT_IMAGE_CONFIG,
  ADDITIONAL_IMAGE_CONFIG,
  ImageValidationResult 
} from '../utils/imageValidation';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  details?: {
    originalName: string;
    fileName: string;
    size: number;
    validation: ImageValidationResult;
  };
}

export interface UploadLog {
  timestamp: string;
  fileName: string;
  originalName: string;
  size: number;
  type: string;
  success: boolean;
  error?: string;
  validation?: ImageValidationResult;
  userAgent?: string;
  userId?: string;
}

/**
 * Faz upload de imagem principal do produto com validação completa
 */
export async function uploadProductMainImage(file: File): Promise<UploadResult> {
  const startTime = Date.now();
  const logs: string[] = [];
  
  const log = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
    logs.push(logEntry);
  };

  try {
    log('Iniciando upload de imagem principal do produto', {
      fileName: file.name,
      size: file.size,
      type: file.type
    });

    // Verificação de segurança inicial
    if (isPotentiallyMalicious(file)) {
      log('Arquivo potencialmente malicioso detectado', { fileName: file.name });
      return {
        success: false,
        error: 'Arquivo suspeito detectado. Por favor, escolha outra imagem.'
      };
    }

    // Validação técnica da imagem
    log('Validando imagem...');
    const validation = await validateImageFile(file, PRODUCT_IMAGE_CONFIG);
    
    if (!validation.isValid) {
      log('Validação falhou', { errors: validation.errors });
      return {
        success: false,
        error: validation.errors.join('. '),
        details: {
          originalName: file.name,
          fileName: '',
          size: file.size,
          validation
        }
      };
    }

    // Avisos de validação
    if (validation.warnings.length > 0) {
      log('Avisos de validação', { warnings: validation.warnings });
    }

    // Verificar autenticação
    log('Verificando autenticação...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      log('Usuário não autenticado');
      return {
        success: false,
        error: 'Você precisa estar autenticado para fazer upload de imagens.'
      };
    }

    // Gerar nome único para o arquivo
    const fileName = generateUniqueFileName(file.name, 'product-main');
    log('Nome do arquivo gerado', { fileName });

    // Tentar upload com retry
    let uploadError = null;
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      attempt++;
      log(`Tentativa de upload ${attempt}/${maxAttempts}`);

      try {
        const { error, data } = await supabase.storage
          .from('products')
          .upload(`main-images/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (error) {
          log(`Upload falhou na tentativa ${attempt}`, { error: error.message });
          uploadError = error;

          // Verificar se é erro de RLS
          if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
            log('Erro de política de segurança (RLS) detectado');
            // Não fazer retry para erros de RLS
            break;
          }

          // Retry para erros de rede
          if (error.message?.includes('network') || error.message?.includes('fetch')) {
            log('Erro de rede, aguardando antes de retry...');
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }

          // Erros que não devem ter retry
          break;
        }

        log(`Upload bem-sucedido na tentativa ${attempt}`);
        uploadError = null;

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(data.path);

        log('Upload completado com sucesso', {
          url: publicUrl,
          duration: Date.now() - startTime
        });

        return {
          success: true,
          url: publicUrl,
          details: {
            originalName: file.name,
            fileName,
            size: file.size,
            validation
          }
        };

      } catch (err) {
        log(`Exceção na tentativa ${attempt}`, { error: err });
        uploadError = err as Error;
        
        if (attempt === maxAttempts) {
          break;
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    const finalError = uploadError || new Error('Upload falhou após todas as tentativas');
    log('Todas as tentativas de upload falharam', { 
      error: finalError.message,
      duration: Date.now() - startTime 
    });

    return {
      success: false,
      error: getUserFriendlyErrorMessage(finalError),
      details: {
        originalName: file.name,
        fileName,
        size: file.size,
        validation
      }
    };

  } catch (error) {
    log('Erro crítico no upload', { error });
    return {
      success: false,
      error: getUserFriendlyErrorMessage(error as Error),
      details: {
        originalName: file.name,
        fileName: '',
        size: file.size,
        validation: { isValid: false, errors: ['Erro crítico'], warnings: [] }
      }
    };
  } finally {
    
  }
}

/**
 * Faz upload de imagens adicionais do produto
 */
export async function uploadProductAdditionalImage(file: File, index: number): Promise<UploadResult> {
  const startTime = Date.now();
  const logs: string[] = [];
  
  const log = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
    logs.push(logEntry);
  };

  try {
    log('Iniciando upload de imagem adicional do produto', {
      fileName: file.name,
      size: file.size,
      type: file.type,
      index
    });

    // Verificação de segurança
    if (isPotentiallyMalicious(file)) {
      log('Arquivo potencialmente malicioso detectado');
      return {
        success: false,
        error: 'Arquivo suspeito detectado. Por favor, escolha outra imagem.'
      };
    }

    // Validação com configuração mais flexível para imagens adicionais
    log('Validando imagem adicional...');
    const validation = await validateImageFile(file, ADDITIONAL_IMAGE_CONFIG);
    
    if (!validation.isValid) {
      log('Validação falhou', { errors: validation.errors });
      return {
        success: false,
        error: validation.errors.join('. '),
        details: {
          originalName: file.name,
          fileName: '',
          size: file.size,
          validation
        }
      };
    }

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      log('Usuário não autenticado');
      return {
        success: false,
        error: 'Você precisa estar autenticado para fazer upload de imagens.'
      };
    }

    // Gerar nome único
    const fileName = generateUniqueFileName(file.name, `product-additional-${index}`);
    log('Nome do arquivo gerado', { fileName });

    // Upload com retry
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      attempt++;
      log(`Tentativa de upload ${attempt}/${maxAttempts}`);

      try {
        const { error, data } = await supabase.storage
          .from('products')
          .upload(`additional-images/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (error) {
          log(`Upload falhou na tentativa ${attempt}`, { error: error.message });

          if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
            log('Erro de RLS detectado');
            break;
          }

          if (error.message?.includes('network') || error.message?.includes('fetch')) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }

          break;
        }

        log(`Upload bem-sucedido na tentativa ${attempt}`);

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(data.path);

        log('Upload completado com sucesso', {
          url: publicUrl,
          duration: Date.now() - startTime
        });

        return {
          success: true,
          url: publicUrl,
          details: {
            originalName: file.name,
            fileName,
            size: file.size,
            validation
          }
        };

      } catch (err) {
        log(`Exceção na tentativa ${attempt}`, { error: err });
        
        if (attempt === maxAttempts) {
          break;
        }
      }
    }

    log('Todas as tentativas de upload falharam', { 
      duration: Date.now() - startTime 
    });

    return {
      success: false,
      error: 'Falha ao fazer upload da imagem adicional. Tente novamente.',
      details: {
        originalName: file.name,
        fileName,
        size: file.size,
        validation
      }
    };

  } catch (error) {
    log('Erro crítico no upload', { error });
    return {
      success: false,
      error: getUserFriendlyErrorMessage(error as Error)
    };
  }
}

/**
 * Remove uma imagem do storage
 */
export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  try {
    

    // Extrair o caminho do arquivo da URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/products\/(.+)/);
    
    if (!pathMatch) {
      console.error('Não foi possível extrair o caminho da imagem:', imageUrl);
      return false;
    }

    const filePath = pathMatch[1];
    

    const { error } = await supabase.storage
      .from('products')
      .remove([filePath]);

    if (error) {
      console.error('Erro ao remover imagem:', error);
      return false;
    }

    
    return true;

  } catch (error) {
    console.error('Erro ao remover imagem:', error);
    return false;
  }
}

/**
 * Converte mensagens de erro técnicas em mensagens amigáveis
 */
function getUserFriendlyErrorMessage(error: Error): string {
  const message = error.message?.toLowerCase() || '';

  if (message.includes('row-level security') || message.includes('rls')) {
    return 'Erro de permissão no servidor. Por favor, entre em contato com o suporte.';
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  if (message.includes('bucket')) {
    return 'Erro de configuração no servidor. Por favor, entre em contato com o suporte.';
  }

  if (message.includes('size') || message.includes('large')) {
    return 'Arquivo muito grande. Tente uma imagem menor.';
  }

  if (message.includes('type') || message.includes('format')) {
    return 'Formato de arquivo não suportado. Use JPG, PNG ou WebP.';
  }

  if (message.includes('unauthorized') || message.includes('permission')) {
    return 'Você não tem permissão para fazer upload de imagens.';
  }

  return 'Erro ao fazer upload da imagem. Tente novamente ou entre em contato com o suporte.';
}
