/**
 * Testes unitários para validação de imagens
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateImageFile,
  sanitizeFileName,
  generateUniqueFileName,
  isPotentiallyMalicious,
  PRODUCT_IMAGE_CONFIG,
  ADDITIONAL_IMAGE_CONFIG
} from '../../utils/imageValidation';

// Mock do objeto Image global
const mockImage = {
  naturalWidth: 800,
  naturalHeight: 600,
  onload: null as any,
  onerror: null as any,
  src: ''
};

// Mock do URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('Image Validation Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sanitizeFileName', () => {
    it('deve remover caracteres especiais', () => {
      const result = sanitizeFileName('imagem@com#caracteres$especiais.jpg');
      expect(result).toBe('imagem_com_caracteres_especiais.jpg');
    });

    it('deve converter para minúsculas', () => {
      const result = sanitizeFileName('IMAGEM-MAIUSCULA.JPG');
      expect(result).toBe('imagem-maiuscula.jpg');
    });

    it('deve remover underscores múltiplos', () => {
      const result = sanitizeFileName('imagem__com___multiplos____underscores.jpg');
      expect(result).toBe('imagem_com_multiplos_underscores.jpg');
    });

    it('deve manter estrutura básica do arquivo', () => {
      const result = sanitizeFileName('minha-imagem-de-produto.png');
      expect(result).toBe('minha-imagem-de-produto.png');
    });
  });

  describe('generateUniqueFileName', () => {
    it('deve gerar nome único com timestamp e random', () => {
      const result = generateUniqueFileName('produto.jpg', 'product');
      expect(result).toMatch(/^product-\d+-[a-z0-9]+\.jpg$/);
    });

    it('deve sanitizar o nome original', () => {
      const result = generateUniqueFileName('produto@especial.jpg', 'main');
      expect(result).toMatch(/^main-\d+-[a-z0-9]+\.jpg$/);
    });

    it('deve usar prefixo padrão se não fornecido', () => {
      const result = generateUniqueFileName('imagem.png');
      expect(result).toMatch(/^product-\d+-[a-z0-9]+\.png$/);
    });

    it('deve manter extensão original', () => {
      const result = generateUniqueFileName('imagem.webp', 'banner');
      expect(result).toMatch(/^banner-\d+-[a-z0-9]+\.webp$/);
    });
  });

  describe('isPotentiallyMalicious', () => {
    it('deve detectar arquivo vazio', () => {
      const file = new File([''], 'vazio.jpg', { type: 'image/jpeg' });
      expect(isPotentiallyMalicious(file)).toBe(true);
    });

    it('deve detectar nome muito longo', () => {
      const longName = 'a'.repeat(256) + '.jpg';
      const file = new File(['conteudo'], longName, { type: 'image/jpeg' });
      expect(isPotentiallyMalicious(file)).toBe(true);
    });

    it('deve detectar path traversal', () => {
      const file = new File(['conteudo'], '../../../etc/passwd.jpg', { type: 'image/jpeg' });
      expect(isPotentiallyMalicious(file)).toBe(true);
    });

    it('deve detectar arquivo oculto', () => {
      const file = new File(['conteudo'], '.htaccess.jpg', { type: 'image/jpeg' });
      expect(isPotentiallyMalicious(file)).toBe(true);
    });

    it('deve detectar mismatch de extensão perigoso', () => {
      const file = new File(['conteudo'], 'imagem.php', { type: 'image/jpeg' });
      expect(isPotentiallyMalicious(file)).toBe(true);
    });

    it('deve permitir mismatch válido jpg/jpeg', () => {
      const file = new File(['conteudo'], 'imagem.jpg', { type: 'image/jpeg' });
      expect(isPotentiallyMalicious(file)).toBe(false);
    });

    it('deve permitir arquivo válido', () => {
      const file = new File(['conteudo'], 'produto.jpg', { type: 'image/jpeg' });
      expect(isPotentiallyMalicious(file)).toBe(false);
    });
  });

  describe('validateImageFile', () => {
    // Mock do construtor Image
    const originalImage = global.Image;

    beforeEach(() => {
      global.Image = vi.fn().mockImplementation(() => mockImage);
    });

    afterEach(() => {
      global.Image = originalImage;
    });

    it('deve rejeitar arquivo nulo', async () => {
      // @ts-ignore
      const result = await validateImageFile(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nenhum arquivo selecionado');
    });

    it('deve rejeitar arquivo vazio', async () => {
      const file = new File([''], 'vazio.jpg', { type: 'image/jpeg' });
      const result = await validateImageFile(file);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Arquivo de imagem está vazio');
    });

    it('deve rejeitar tipo MIME inválido', async () => {
      const file = new File(['conteudo'], 'imagem.pdf', { type: 'application/pdf' });
      const result = await validateImageFile(file);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Formato de arquivo não permitido');
    });

    it('deve rejeitar arquivo muito grande', async () => {
      const largeContent = new Uint8Array(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], 'grande.jpg', { type: 'image/jpeg' });
      const result = await validateImageFile(file);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Tamanho máximo permitido: 10.0MB');
    });

    it('deve validar imagem válida', async () => {
      // Simular carregamento bem-sucedido da imagem
      setTimeout(() => {
        mockImage.onload();
      }, 10);

      const file = new File(['conteudo-imagem'], 'produto.jpg', { type: 'image/jpeg' });
      const result = await validateImageFile(file);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata).toBeDefined();
    });

    it('deve detectar imagem muito pequena', async () => {
      mockImage.naturalWidth = 200;
      mockImage.naturalHeight = 200;

      setTimeout(() => {
        mockImage.onload();
      }, 10);

      const file = new File(['conteudo'], 'pequena.jpg', { type: 'image/jpeg' });
      const result = await validateImageFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Largura mínima: 300px');
      expect(result.errors[1]).toContain('Altura mínima: 300px');
    });

    it('deve detectar proporção inadequada', async () => {
      // Mockar imagem com proporção inadequada mas dimensões válidas
      const testImage = {
        naturalWidth: 1200,
        naturalHeight: 300, // Proporção 4:1 (1200:300)
        onload: null as any,
        onerror: null as any,
        src: ''
      };

      global.Image = vi.fn().mockImplementation(() => testImage);

      // Simular carregamento bem-sucedido
      setTimeout(() => {
        if (testImage.onload) testImage.onload();
      }, 10);

      const file = new File(['conteudo'], 'larga.jpg', { type: 'image/jpeg' });
      const result = await validateImageFile(file, PRODUCT_IMAGE_CONFIG);

      expect(result.isValid).toBe(true); // Ainda válida, mas com aviso
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Proporção recomendada');
    });

    it('deve usar configuração personalizada', async () => {
      mockImage.naturalWidth = 400;
      mockImage.naturalHeight = 400;

      setTimeout(() => {
        mockImage.onload();
      }, 10);

      const customConfig = {
        ...PRODUCT_IMAGE_CONFIG,
        minWidth: 500,
        minHeight: 500
      };

      const file = new File(['conteudo'], 'produto.jpg', { type: 'image/jpeg' });
      const result = await validateImageFile(file, customConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Largura mínima: 500px');
    });
  });

  describe('Configurações de Upload', () => {
    it('deve ter configuração padrão para imagens principais', () => {
      expect(PRODUCT_IMAGE_CONFIG.maxFileSize).toBe(10 * 1024 * 1024);
      expect(PRODUCT_IMAGE_CONFIG.minWidth).toBe(300);
      expect(PRODUCT_IMAGE_CONFIG.minHeight).toBe(300);
      expect(PRODUCT_IMAGE_CONFIG.allowedFormats).toContain('jpeg');
      expect(PRODUCT_IMAGE_CONFIG.allowedFormats).toContain('png');
      expect(PRODUCT_IMAGE_CONFIG.recommendedAspectRatio).toBe(1.0);
    });

    it('deve ter configuração mais flexível para imagens adicionais', () => {
      expect(ADDITIONAL_IMAGE_CONFIG.minWidth).toBe(200);
      expect(ADDITIONAL_IMAGE_CONFIG.minHeight).toBe(200);
      expect(ADDITIONAL_IMAGE_CONFIG.recommendedAspectRatio).toBe(1.33);
      expect(ADDITIONAL_IMAGE_CONFIG.aspectRatioTolerance).toBe(0.5);
    });
  });
});