-- Adicionar colunas para recursos de produtos
ALTER TABLE products 
ADD COLUMN featured_in_dropdown BOOLEAN DEFAULT FALSE,
ADD COLUMN is_disabled BOOLEAN DEFAULT FALSE,
ADD COLUMN featured_on_homepage BOOLEAN DEFAULT FALSE,
ADD COLUMN clearance_sale BOOLEAN DEFAULT FALSE;

-- Comentários para documentar as colunas
COMMENT ON COLUMN products.featured_in_dropdown IS 'Produto em destaque no dropdown da categoria';
COMMENT ON COLUMN products.is_disabled IS 'Produto desativado - não será exibido';
COMMENT ON COLUMN products.featured_on_homepage IS 'Produto destaque na página home';
COMMENT ON COLUMN products.clearance_sale IS 'Produto em queima de estoque';

-- Criar índices para melhor performance nas consultas
CREATE INDEX idx_products_featured_dropdown ON products(featured_in_dropdown) WHERE featured_in_dropdown = TRUE;
CREATE INDEX idx_products_not_disabled ON products(is_disabled) WHERE is_disabled = FALSE;
CREATE INDEX idx_products_featured_homepage ON products(featured_on_homepage) WHERE featured_on_homepage = TRUE;
CREATE INDEX idx_products_clearance_sale ON products(clearance_sale) WHERE clearance_sale = TRUE;