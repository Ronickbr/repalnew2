-- Adicionar coluna image_url na tabela products
ALTER TABLE products ADD COLUMN image_url TEXT;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN products.image_url IS 'URL local da imagem do produto (ex: /img/produto.jpg)';

-- Conceder permissões para os roles anon e authenticated
GRANT SELECT, INSERT, UPDATE ON products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;