-- Migração para reestruturar o banco de dados em três tabelas separadas:
-- 1. categories (categorias principais)
-- 2. subcategories (subcategorias)
-- 3. products (produtos atualizados)

-- Primeiro, vamos criar uma tabela temporária para backup dos dados existentes
CREATE TABLE IF NOT EXISTS temp_categories_backup AS SELECT * FROM categories;
CREATE TABLE IF NOT EXISTS temp_products_backup AS SELECT * FROM products;

-- Limpar dados existentes
DELETE FROM products;
DELETE FROM categories;

-- Remover colunas desnecessárias da tabela categories
ALTER TABLE categories DROP COLUMN IF EXISTS parent_id;
ALTER TABLE categories DROP COLUMN IF EXISTS is_parent;
ALTER TABLE categories DROP COLUMN IF EXISTS level;
ALTER TABLE categories DROP COLUMN IF EXISTS icon;

-- Adicionar coluna image_url e is_active na tabela categories se não existir
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Criar tabela subcategories
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remover foreign key constraint existente de subcategory_id se existir
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_subcategory_id_fkey;

-- Atualizar tabela products para referenciar subcategory_id corretamente
ALTER TABLE products DROP COLUMN IF EXISTS subcategory_id;
ALTER TABLE products ADD COLUMN subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;

-- Adicionar colunas necessárias na tabela products se não existirem
ALTER TABLE products ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Renomear colunas se necessário (verificar se existem antes)
DO $$
BEGIN
    -- Renomear product_name para name se a coluna existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'product_name') THEN
        ALTER TABLE products RENAME COLUMN product_name TO name;
    END IF;
    
    -- Renomear benefits para features se a coluna existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'benefits') THEN
        ALTER TABLE products RENAME COLUMN benefits TO features;
    END IF;
    
    -- Renomear featured para is_featured se a coluna existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'featured') THEN
        ALTER TABLE products RENAME COLUMN featured TO is_featured;
    END IF;
    
    -- Renomear active para is_active se a coluna existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'active') THEN
        ALTER TABLE products RENAME COLUMN active TO is_active;
    END IF;
END $$;

-- Adicionar is_active se não existir
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_active ON subcategories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);

-- Inserir categorias principais
INSERT INTO categories (id, name, slug, description, image_url, is_active, sort_order) VALUES
(gen_random_uuid(), 'Refrigeração Comercial', 'refrigeracao-comercial', 'Equipamentos de refrigeração para uso comercial', '/images/categories/refrigeracao-comercial.jpg', true, 1),
(gen_random_uuid(), 'Equipamentos para Bares e Restaurantes', 'equipamentos-bares-restaurantes', 'Equipamentos profissionais para bares e restaurantes', '/images/categories/equipamentos-bares-restaurantes.jpg', true, 2),
(gen_random_uuid(), 'Padaria e Confeitaria', 'padaria-confeitaria', 'Equipamentos especializados para padarias e confeitarias', '/images/categories/padaria-confeitaria.jpg', true, 3),
(gen_random_uuid(), 'Açougue', 'acougue', 'Equipamentos para açougues e processamento de carnes', '/images/categories/acougue.jpg', true, 4),
(gen_random_uuid(), 'Utensílios e Utilidades', 'utensilios-utilidades', 'Utensílios diversos para cozinha profissional', '/images/categories/utensilios-utilidades.jpg', true, 5),
(gen_random_uuid(), 'Mobiliário em Inox', 'mobiliario-inox', 'Móveis e estruturas em aço inoxidável', '/images/categories/mobiliario-inox.jpg', true, 6),
(gen_random_uuid(), 'Peças e Componentes para Refrigeração', 'pecas-componentes-refrigeracao', 'Peças de reposição e componentes para refrigeração', '/images/categories/pecas-componentes-refrigeracao.jpg', true, 7);

-- Inserir subcategorias para Refrigeração Comercial
INSERT INTO subcategories (name, slug, description, category_id, sort_order) VALUES
('Bebedouros', 'bebedouros', 'Bebedouros comerciais e industriais', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), 1),
('Câmaras Frias', 'camaras-frias', 'Câmaras frigoríficas para conservação', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), 2),
('Cervejeiras', 'cervejeiras', 'Cervejeiras e geladeiras para bebidas', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), 3),
('Expositores', 'expositores', 'Expositores refrigerados', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), 4),
('Freezers Comerciais', 'freezers-comerciais', 'Freezers para uso comercial', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), 5),
('Geladeiras Profissionais', 'geladeiras-profissionais', 'Geladeiras para uso profissional', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), 6),
('Ilhas para Congelados', 'ilhas-congelados', 'Ilhas de congelados para supermercados', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), 7),
('Visa-Coolers', 'visa-coolers', 'Visa-coolers e refrigeradores verticais', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), 8);

-- Inserir subcategorias para Equipamentos para Bares e Restaurantes
INSERT INTO subcategories (name, slug, description, category_id, sort_order) VALUES
('Fornos Industriais', 'fornos-industriais', 'Fornos de alta performance para cozinhas profissionais', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), 1),
('Fritadeiras', 'fritadeiras', 'Fritadeiras elétricas e a gás para uso comercial', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), 2),
('Chapas e Grelhas', 'chapas-grelhas', 'Chapas e grelhas para preparo de alimentos', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), 3),
('Fogões Industriais', 'fogoes-industriais', 'Fogões para cozinha industrial', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), 4),
('Cafeteiras Profissionais', 'cafeteiras-profissionais', 'Cafeteiras para uso comercial', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), 5),
('Liquidificadores Profissionais', 'liquidificadores-profissionais', 'Liquidificadores de alta potência', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), 6),
('Processadores de Alimentos', 'processadores-alimentos', 'Processadores industriais de alimentos', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), 7),
('Lava-louças Industriais', 'lava-loucas-industriais', 'Lava-louças para uso industrial', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), 8);

-- Inserir subcategorias para Padaria e Confeitaria
INSERT INTO subcategories (name, slug, description, category_id, sort_order) VALUES
('Amassadeiras', 'amassadeiras', 'Amassadeiras para panificação', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), 1),
('Batedeiras Industriais', 'batedeiras-industriais', 'Batedeiras de alta capacidade', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), 2),
('Fornos Turbo', 'fornos-turbo', 'Fornos turbo para panificação', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), 3),
('Fornos de Convecção', 'fornos-conveccao', 'Fornos de convecção para panificação', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), 4),
('Divisoras de Massa', 'divisoras-massa', 'Divisoras automáticas de massa', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), 5),
('Modeladoras de Pão', 'modeladoras-pao', 'Modeladoras automáticas de pão', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), 6);

-- Inserir subcategorias para Açougue
INSERT INTO subcategories (name, slug, description, category_id, sort_order) VALUES
('Moedores de Carne', 'moedores-carne', 'Moedores industriais de carne', (SELECT id FROM categories WHERE slug = 'acougue'), 1),
('Serras-Fita', 'serras-fita', 'Serras-fita para corte de carne', (SELECT id FROM categories WHERE slug = 'acougue'), 2),
('Balcões Refrigerados', 'balcoes-refrigerados-acougue', 'Balcões refrigerados para açougue', (SELECT id FROM categories WHERE slug = 'acougue'), 3),
('Balanças', 'balancas-digitais-mecanicas', 'Balanças digitais e mecânicas', (SELECT id FROM categories WHERE slug = 'acougue'), 4);

-- Inserir subcategorias para Utensílios e Utilidades
INSERT INTO subcategories (name, slug, description, category_id, sort_order) VALUES
('Panelas Profissionais', 'panelas-profissionais', 'Panelas para cozinha profissional', (SELECT id FROM categories WHERE slug = 'utensilios-utilidades'), 1),
('Cubas GNs', 'cubas-gns', 'Cubas gastronômicas padrão GN', (SELECT id FROM categories WHERE slug = 'utensilios-utilidades'), 2),
('Formas e Assadeiras', 'formas-assadeiras', 'Formas e assadeiras profissionais', (SELECT id FROM categories WHERE slug = 'utensilios-utilidades'), 3),
('Talheres', 'talheres', 'Talheres profissionais', (SELECT id FROM categories WHERE slug = 'utensilios-utilidades'), 4);

-- Inserir subcategorias para Mobiliário em Inox
INSERT INTO subcategories (name, slug, description, category_id, sort_order) VALUES
('Bancadas em Aço Inox', 'bancadas-aco-inox', 'Bancadas em aço inoxidável', (SELECT id FROM categories WHERE slug = 'mobiliario-inox'), 1),
('Estantes', 'estantes', 'Estantes em aço inoxidável', (SELECT id FROM categories WHERE slug = 'mobiliario-inox'), 2),
('Pias de Assepsia', 'pias-assepsia', 'Pias para higienização', (SELECT id FROM categories WHERE slug = 'mobiliario-inox'), 3),
('Carrinhos', 'carrinhos', 'Carrinhos de transporte em inox', (SELECT id FROM categories WHERE slug = 'mobiliario-inox'), 4);

-- Inserir subcategorias para Peças e Componentes
INSERT INTO subcategories (name, slug, description, category_id, sort_order) VALUES
('Compressores', 'compressores', 'Compressores para refrigeração', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), 1),
('Evaporadores', 'evaporadores', 'Evaporadores para refrigeração', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), 2),
('Controladores', 'controladores', 'Controladores de temperatura', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), 3),
('Válvulas', 'valvulas', 'Válvulas para refrigeração', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), 4);

-- Inserir produtos de exemplo
INSERT INTO products (name, slug, description, short_description, category_id, subcategory_id, price, sku, specifications, features, is_featured, image_url) VALUES
('Forno Turbo Elétrico 5 Telas', 'forno-turbo-eletrico-5-telas', 'Forno turbo elétrico profissional com 5 telas, ideal para padarias e confeitarias. Sistema de ventilação forçada garante cozimento uniforme.', 'Forno turbo elétrico com 5 telas e ventilação forçada', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), (SELECT id FROM subcategories WHERE slug = 'fornos-turbo'), 8500.00, 'FTE-5T-001', '{"potencia": "12kW", "tensao": "220V/380V", "capacidade": "5 telas 60x40cm", "temperatura": "50°C a 300°C"}', ARRAY['Ventilação forçada', 'Controle digital de temperatura', 'Timer programável', 'Porta dupla com vidro', 'Estrutura em aço inox'], true, '/images/products/forno-turbo-eletrico-5-telas.jpg'),
('Fritadeira Elétrica 2 Cestos', 'fritadeira-eletrica-2-cestos', 'Fritadeira elétrica profissional com 2 cestos independentes, controle de temperatura individual e sistema de filtragem de óleo.', 'Fritadeira elétrica com 2 cestos independentes', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), (SELECT id FROM subcategories WHERE slug = 'fritadeiras'), 3200.00, 'FE-2C-001', '{"potencia": "6kW", "tensao": "220V", "capacidade": "2x8L", "temperatura": "120°C a 190°C"}', ARRAY['2 cestos independentes', 'Controle digital', 'Sistema de filtragem', 'Resistência blindada', 'Estrutura em aço inox'], true, '/images/products/fritadeira-eletrica-2-cestos.jpg'),
('Chapa Bifeteira a Gás', 'chapa-bifeteira-gas', 'Chapa bifeteira a gás com superfície lisa e estriada, ideal para preparo de carnes, sanduíches e diversos alimentos.', 'Chapa bifeteira a gás com superfície mista', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), (SELECT id FROM subcategories WHERE slug = 'chapas-grelhas'), 2800.00, 'CBG-001', '{"potencia": "24000 BTU/h", "gas": "GLP/GN", "superficie": "60x40cm", "espessura": "15mm"}', ARRAY['Superfície mista (lisa/estriada)', 'Queimadores de alta eficiência', 'Controle individual de chamas', 'Bandeja coletora removível', 'Estrutura robusta'], false, '/images/products/chapa-bifeteira-gas.jpg'),
('Geladeira Comercial 4 Portas', 'geladeira-comercial-4-portas', 'Geladeira comercial de 4 portas em aço inox, ideal para restaurantes e estabelecimentos de grande porte.', 'Geladeira comercial 4 portas em inox', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), (SELECT id FROM subcategories WHERE slug = 'geladeiras-profissionais'), 4500.00, 'GC-4P-001', '{"capacidade": "1200L", "tensao": "220V", "temperatura": "0°C a 8°C", "dimensoes": "200x70x200cm"}', ARRAY['Grande capacidade de armazenamento', '4 portas independentes', 'Sistema de refrigeração eficiente', 'Prateleiras reguláveis', 'Controle digital'], true, '/images/products/geladeira-comercial-4-portas.jpg'),
('Mesa de Apoio Inox', 'mesa-apoio-inox', 'Mesa de apoio em aço inox AISI 304, com prateleira inferior e pés reguláveis.', 'Mesa de apoio em aço inox com prateleira', (SELECT id FROM categories WHERE slug = 'mobiliario-inox'), (SELECT id FROM subcategories WHERE slug = 'bancadas-aco-inox'), 850.00, 'MAI-001', '{"material": "Aço Inox AISI 304", "dimensoes": "150x70x85cm", "espessura": "1,2mm", "peso": "45kg"}', ARRAY['Construção em aço inox', 'Prateleira inferior', 'Pés reguláveis', 'Fácil limpeza', 'Design ergonômico'], false, '/images/products/mesa-apoio-inox.jpg');

-- Habilitar RLS nas novas tabelas
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para subcategories
CREATE POLICY "Allow public read access on subcategories" ON subcategories
  FOR SELECT USING (true);

-- Conceder permissões para anon e authenticated
GRANT SELECT ON subcategories TO anon;
GRANT ALL PRIVILEGES ON subcategories TO authenticated;

-- Criar trigger para updated_at na tabela subcategories
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Remover tabelas de backup
DROP TABLE IF EXISTS temp_categories_backup;
DROP TABLE IF EXISTS temp_products_backup;

-- Comentários explicativos
COMMENT ON TABLE categories IS 'Tabela de categorias principais';
COMMENT ON TABLE subcategories IS 'Tabela de subcategorias vinculadas às categorias principais';
COMMENT ON COLUMN products.category_id IS 'Referência à categoria principal do produto';
COMMENT ON COLUMN products.subcategory_id IS 'Referência à subcategoria específica do produto';