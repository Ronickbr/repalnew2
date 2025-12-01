// Utilitários para download de arquivos

export interface DownloadOptions {
  filename?: string;
  mimeType?: string;
}

/**
 * Faz download de um arquivo a partir de dados binários ou texto
 */
export const downloadFile = (
  data: string | Blob | ArrayBuffer,
  filename: string,
  mimeType: string = 'application/octet-stream'
): void => {
  try {
    let blob: Blob;

    if (data instanceof Blob) {
      blob = data;
    } else if (data instanceof ArrayBuffer) {
      blob = new Blob([data], { type: mimeType });
    } else {
      // String data
      blob = new Blob([data], { type: mimeType });
    }

    // Criar URL temporária para o blob
    const url = URL.createObjectURL(blob);

    // Criar elemento de link temporário
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpar URL temporária
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao fazer download do arquivo:', error);
    throw new Error('Falha ao fazer download do arquivo');
  }
};

/**
 * Gera nome de arquivo baseado nas configurações
 */
export const generateFilename = (
  prefix: string,
  format: string,
  timestamp?: Date
): string => {
  const date = timestamp || new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  
  return `${prefix}-${dateStr}-${timeStr}.${format}`;
};

/**
 * Determina o tipo MIME baseado no formato do arquivo
 */
export const getMimeType = (format: string): string => {
  const mimeTypes: Record<string, string> = {
    'sql': 'application/sql',
    'json': 'application/json',
    'csv': 'text/csv',
    'zip': 'application/zip',
    'gz': 'application/gzip'
  };

  return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
};

/**
 * Faz download de arquivo a partir de dados
 */
export const downloadFileData = async (
  prefix: string,
  format: string,
  fileData: string | Blob | ArrayBuffer
): Promise<void> => {
  try {
    const filename = generateFilename(prefix, format);
    const mimeType = getMimeType(format);

    downloadFile(fileData, filename, mimeType);
  } catch (error) {
    console.error('Erro ao fazer download do arquivo:', error);
    throw error;
  }
};

/**
 * Converte dados para formato apropriado para download
 */
export const prepareData = (
  data: unknown,
  format: string
): string => {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv':
      // Para CSV, assumimos que os dados já estão formatados
      return typeof data === 'string' ? data : JSON.stringify(data);
    case 'sql':
      // Para SQL, assumimos que os dados já estão formatados
      return typeof data === 'string' ? data : JSON.stringify(data);
    default:
      return typeof data === 'string' ? data : JSON.stringify(data);
  }
};
