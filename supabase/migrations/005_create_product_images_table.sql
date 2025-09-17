-- Criar tabela product_images para suportar múltiplas imagens por produto
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON product_images(sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(is_primary);

-- Migrar dados existentes da coluna image_url da tabela products
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
SELECT 
    id as product_id,
    image_url,
    product_name as alt_text,
    0 as sort_order,
    true as is_primary
FROM products 
WHERE image_url IS NOT NULL AND image_url != '';

-- Adicionar algumas imagens adicionais de exemplo para produtos existentes
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
-- Imagens adicionais para produtos existentes (usando URLs de exemplo)
((SELECT id FROM products LIMIT 1), '/images/products/equipamento-detalhe.jpg', 'Vista detalhada do equipamento', 1, false),
((SELECT id FROM products LIMIT 1), '/images/products/equipamento-lateral.jpg', 'Vista lateral do equipamento', 2, false),
((SELECT id FROM products LIMIT 1), '/images/products/equipamento-interior.jpg', 'Vista interior do equipamento', 3, false);

-- Conceder permissões para os roles
GRANT SELECT ON product_images TO anon;
GRANT ALL PRIVILEGES ON product_images TO authenticated;

-- Comentários para documentação
COMMENT ON TABLE product_images IS 'Tabela para armazenar múltiplas imagens por produto';
COMMENT ON COLUMN product_images.product_id IS 'Referência ao produto';
COMMENT ON COLUMN product_images.image_url IS 'URL da imagem do produto';
COMMENT ON COLUMN product_images.alt_text IS 'Texto alternativo para acessibilidade';
COMMENT ON COLUMN product_images.sort_order IS 'Ordem de exibição das imagens';
COMMENT ON COLUMN product_images.is_primary IS 'Indica se é a imagem principal do produto';