-- Migração para criar estrutura hierárquica de categorias
-- Baseado na seção 4.1.1 das especificações

-- Primeiro, vamos adicionar a coluna parent_id à tabela categories existente
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_parent ON categories(is_parent);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);

-- Limpar produtos e categorias existentes para inserir a nova estrutura
DELETE FROM products;
DELETE FROM categories;

-- Inserir categorias principais (pai)
INSERT INTO categories (id, name, slug, description, is_parent, level, sort_order) VALUES
(gen_random_uuid(), 'Refrigeração Comercial', 'refrigeracao-comercial', 'Equipamentos de refrigeração para uso comercial', true, 0, 1),
(gen_random_uuid(), 'Equipamentos para Bares e Restaurantes', 'equipamentos-bares-restaurantes', 'Equipamentos profissionais para bares e restaurantes', true, 0, 2),
(gen_random_uuid(), 'Padaria e Confeitaria', 'padaria-confeitaria', 'Equipamentos especializados para padarias e confeitarias', true, 0, 3),
(gen_random_uuid(), 'Açougue', 'acougue', 'Equipamentos para açougues e processamento de carnes', true, 0, 4),
(gen_random_uuid(), 'Utensílios e Utilidades', 'utensilios-utilidades', 'Utensílios diversos para cozinha profissional', true, 0, 5),
(gen_random_uuid(), 'Mobiliário em Inox', 'mobiliario-inox', 'Móveis e estruturas em aço inoxidável', true, 0, 6),
(gen_random_uuid(), 'Peças e Componentes para Refrigeração', 'pecas-componentes-refrigeracao', 'Peças de reposição e componentes para refrigeração', true, 0, 7);

-- Inserir subcategorias para Refrigeração Comercial
INSERT INTO categories (id, name, slug, description, parent_id, is_parent, level, sort_order) VALUES
(gen_random_uuid(), 'Bebedouros', 'bebedouros', 'Bebedouros comerciais e industriais', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), false, 1, 1),
(gen_random_uuid(), 'Câmaras Frias', 'camaras-frias', 'Câmaras frigoríficas para conservação', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), false, 1, 2),
(gen_random_uuid(), 'Cervejeiras', 'cervejeiras', 'Cervejeiras e geladeiras para bebidas', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), false, 1, 3),
(gen_random_uuid(), 'Expositores', 'expositores', 'Expositores refrigerados', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), false, 1, 4),
(gen_random_uuid(), 'Freezers Comerciais', 'freezers-comerciais', 'Freezers para uso comercial', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), false, 1, 5),
(gen_random_uuid(), 'Geladeiras Profissionais', 'geladeiras-profissionais', 'Geladeiras para uso profissional', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), false, 1, 6),
(gen_random_uuid(), 'Ilhas para Congelados', 'ilhas-congelados', 'Ilhas de congelados para supermercados', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), false, 1, 7),
(gen_random_uuid(), 'Visa-Coolers', 'visa-coolers', 'Visa-coolers e refrigeradores verticais', (SELECT id FROM categories WHERE slug = 'refrigeracao-comercial'), false, 1, 8);

-- Inserir subcategorias para Equipamentos para Bares e Restaurantes
INSERT INTO categories (id, name, slug, description, parent_id, is_parent, level, sort_order) VALUES
(gen_random_uuid(), 'Batedores de Milk Shake', 'batedores-milk-shake', 'Batedores profissionais para milk shake', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 1),
(gen_random_uuid(), 'Cafeteiras Profissionais', 'cafeteiras-profissionais', 'Cafeteiras para uso comercial', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 2),
(gen_random_uuid(), 'Chapas a Gás e Elétricas', 'chapas-gas-eletricas', 'Chapas para cocção profissional', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 3),
(gen_random_uuid(), 'Cilindros de Massas', 'cilindros-massas', 'Cilindros para abertura de massas', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 4),
(gen_random_uuid(), 'Cortadores de Legumes', 'cortadores-legumes', 'Cortadores profissionais de legumes', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 5),
(gen_random_uuid(), 'Cutters', 'cutters', 'Cutters para processamento de alimentos', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 6),
(gen_random_uuid(), 'Descascadores de Batata', 'descascadores-batata', 'Descascadores industriais de batata', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 7),
(gen_random_uuid(), 'Estufas Quentes', 'estufas-quentes', 'Estufas para manter alimentos aquecidos', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 8),
(gen_random_uuid(), 'Extratores de Suco', 'extratores-suco', 'Extratores profissionais de suco', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 9),
(gen_random_uuid(), 'Fogões Industriais', 'fogoes-industriais', 'Fogões para cozinha industrial', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 10),
(gen_random_uuid(), 'Fornos Combinados', 'fornos-combinados', 'Fornos combinados profissionais', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 11),
(gen_random_uuid(), 'Fornos de Convecção', 'fornos-conveccao', 'Fornos de convecção para panificação', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 12),
(gen_random_uuid(), 'Fornos de Lastro', 'fornos-lastro', 'Fornos de lastro para pizzas e pães', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 13),
(gen_random_uuid(), 'Fritadeiras Elétricas e a Gás', 'fritadeiras-eletricas-gas', 'Fritadeiras profissionais', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 14),
(gen_random_uuid(), 'Lava-louças Industriais', 'lava-loucas-industriais', 'Lava-louças para uso industrial', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 15),
(gen_random_uuid(), 'Liquidificadores Profissionais', 'liquidificadores-profissionais', 'Liquidificadores de alta potência', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 16),
(gen_random_uuid(), 'Mesas de Buffet', 'mesas-buffet', 'Mesas aquecidas para buffet', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 17),
(gen_random_uuid(), 'Micro-ondas Industrial', 'micro-ondas-industrial', 'Micro-ondas para uso comercial', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 18),
(gen_random_uuid(), 'Moedores de Café', 'moedores-cafe', 'Moedores profissionais de café', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 19),
(gen_random_uuid(), 'Moinhos de Pão', 'moinhos-pao', 'Moinhos para farinha de pão', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 20),
(gen_random_uuid(), 'Processadores de Alimentos', 'processadores-alimentos', 'Processadores industriais de alimentos', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 21),
(gen_random_uuid(), 'Refresqueiras', 'refresqueiras', 'Refresqueiras para bebidas', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 22),
(gen_random_uuid(), 'Seladoras a Vácuo e de Embalagens', 'seladoras-vacuo-embalagens', 'Seladoras profissionais', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 23),
(gen_random_uuid(), 'Torres de Chopp', 'torres-chopp', 'Torres e equipamentos para chopp', (SELECT id FROM categories WHERE slug = 'equipamentos-bares-restaurantes'), false, 1, 24);

-- Inserir subcategorias para Padaria e Confeitaria
INSERT INTO categories (id, name, slug, description, parent_id, is_parent, level, sort_order) VALUES
(gen_random_uuid(), 'Amassadeiras', 'amassadeiras', 'Amassadeiras para panificação', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), false, 1, 1),
(gen_random_uuid(), 'Batedeiras Industriais', 'batedeiras-industriais', 'Batedeiras de alta capacidade', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), false, 1, 2),
(gen_random_uuid(), 'Câmaras Climáticas', 'camaras-climaticas', 'Câmaras de fermentação controlada', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), false, 1, 3),
(gen_random_uuid(), 'Cortadores de Frios', 'cortadores-frios', 'Cortadores de frios e embutidos', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), false, 1, 4),
(gen_random_uuid(), 'Divisoras de Massa', 'divisoras-massa', 'Divisoras automáticas de massa', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), false, 1, 5),
(gen_random_uuid(), 'Fatiadeiras de Pão', 'fatiadeiras-pao', 'Fatiadeiras automáticas de pão', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), false, 1, 6),
(gen_random_uuid(), 'Fornos Turbo', 'fornos-turbo', 'Fornos turbo para panificação', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), false, 1, 7),
(gen_random_uuid(), 'Modeladoras de Pão', 'modeladoras-pao', 'Modeladoras automáticas de pão', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), false, 1, 8),
(gen_random_uuid(), 'Resfriadores de Água', 'resfriadores-agua', 'Resfriadores de água para panificação', (SELECT id FROM categories WHERE slug = 'padaria-confeitaria'), false, 1, 9);

-- Inserir subcategorias para Açougue
INSERT INTO categories (id, name, slug, description, parent_id, is_parent, level, sort_order) VALUES
(gen_random_uuid(), 'Amassadores de Carne', 'amassadores-carne', 'Amassadores para preparo de carne', (SELECT id FROM categories WHERE slug = 'acougue'), false, 1, 1),
(gen_random_uuid(), 'Aplicadores de Filme', 'aplicadores-filme', 'Aplicadores de filme plástico', (SELECT id FROM categories WHERE slug = 'acougue'), false, 1, 2),
(gen_random_uuid(), 'Assadores', 'assadores', 'Assadores para carnes', (SELECT id FROM categories WHERE slug = 'acougue'), false, 1, 3),
(gen_random_uuid(), 'Balanças Digitais e Mecânicas', 'balancas-digitais-mecanicas', 'Balanças para pesagem', (SELECT id FROM categories WHERE slug = 'acougue'), false, 1, 4),
(gen_random_uuid(), 'Balcões Refrigerados para Açougue', 'balcoes-refrigerados-acougue', 'Balcões refrigerados especiais', (SELECT id FROM categories WHERE slug = 'acougue'), false, 1, 5),
(gen_random_uuid(), 'Ensacadeiras de Linguiça', 'ensacadeiras-linguica', 'Ensacadeiras para linguiças', (SELECT id FROM categories WHERE slug = 'acougue'), false, 1, 6),
(gen_random_uuid(), 'Moedores de Carne', 'moedores-carne', 'Moedores industriais de carne', (SELECT id FROM categories WHERE slug = 'acougue'), false, 1, 7),
(gen_random_uuid(), 'Serras-Fita', 'serras-fita', 'Serras-fita para corte de carne', (SELECT id FROM categories WHERE slug = 'acougue'), false, 1, 8);

-- Inserir subcategorias para Utensílios e Utilidades
INSERT INTO categories (id, name, slug, description, parent_id, is_parent, level, sort_order) VALUES
(gen_random_uuid(), 'Copos e Taças', 'copos-tacas', 'Copos e taças profissionais', (SELECT id FROM categories WHERE slug = 'utensilios-utilidades'), false, 1, 1),
(gen_random_uuid(), 'Cubas GNs', 'cubas-gns', 'Cubas gastronômicas padrão GN', (SELECT id FROM categories WHERE slug = 'utensilios-utilidades'), false, 1, 2),
(gen_random_uuid(), 'Formas e Assadeiras', 'formas-assadeiras', 'Formas e assadeiras profissionais', (SELECT id FROM categories WHERE slug = 'utensilios-utilidades'), false, 1, 3),
(gen_random_uuid(), 'Jarras', 'jarras', 'Jarras para bebidas', (SELECT id FROM categories WHERE slug = 'utensilios-utilidades'), false, 1, 4),
(gen_random_uuid(), 'Louças', 'loucas', 'Louças para uso comercial', (SELECT id FROM categories WHERE slug = 'utensilios-utilidades'), false, 1, 5),
(gen_random_uuid(), 'Panelas Profissionais', 'panelas-profissionais', 'Panelas para cozinha profissional', (SELECT id FROM categories WHERE slug = 'utensilios-utilidades'), false, 1, 6),
(gen_random_uuid(), 'Talheres', 'talheres', 'Talheres profissionais', (SELECT id FROM categories WHERE slug = 'utensilios-utilidades'), false, 1, 7),
(gen_random_uuid(), 'Travessas', 'travessas', 'Travessas para servir', (SELECT id FROM categories WHERE slug = 'utensilios-utilidades'), false, 1, 8),
(gen_random_uuid(), 'Utensílios Diversos', 'utensilios-diversos', 'Diversos utensílios de cozinha', (SELECT id FROM categories WHERE slug = 'utensilios-utilidades'), false, 1, 9);

-- Inserir subcategorias para Mobiliário em Inox
INSERT INTO categories (id, name, slug, description, parent_id, is_parent, level, sort_order) VALUES
(gen_random_uuid(), 'Bancadas em Aço Inox', 'bancadas-aco-inox', 'Bancadas em aço inoxidável', (SELECT id FROM categories WHERE slug = 'mobiliario-inox'), false, 1, 1),
(gen_random_uuid(), 'Carrinhos', 'carrinhos', 'Carrinhos de transporte em inox', (SELECT id FROM categories WHERE slug = 'mobiliario-inox'), false, 1, 2),
(gen_random_uuid(), 'Estantes', 'estantes', 'Estantes em aço inoxidável', (SELECT id FROM categories WHERE slug = 'mobiliario-inox'), false, 1, 3),
(gen_random_uuid(), 'Lixeiras', 'lixeiras', 'Lixeiras em aço inox', (SELECT id FROM categories WHERE slug = 'mobiliario-inox'), false, 1, 4),
(gen_random_uuid(), 'Pias de Assepsia', 'pias-assepsia', 'Pias para higienização', (SELECT id FROM categories WHERE slug = 'mobiliario-inox'), false, 1, 5),
(gen_random_uuid(), 'Prateleiras', 'prateleiras', 'Prateleiras em aço inoxidável', (SELECT id FROM categories WHERE slug = 'mobiliario-inox'), false, 1, 6);

-- Inserir subcategorias para Peças e Componentes para Refrigeração
INSERT INTO categories (id, name, slug, description, parent_id, is_parent, level, sort_order) VALUES
(gen_random_uuid(), 'Compressores', 'compressores', 'Compressores para refrigeração', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 1),
(gen_random_uuid(), 'Conexões', 'conexoes', 'Conexões para sistemas de refrigeração', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 2),
(gen_random_uuid(), 'Controladores', 'controladores', 'Controladores de temperatura', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 3),
(gen_random_uuid(), 'Evaporadores', 'evaporadores', 'Evaporadores para refrigeração', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 4),
(gen_random_uuid(), 'Filtros', 'filtros', 'Filtros para sistemas de refrigeração', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 5),
(gen_random_uuid(), 'Forçadores de Ar', 'forcadores-ar', 'Forçadores de ar para refrigeração', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 6),
(gen_random_uuid(), 'Gás Refrigerante', 'gas-refrigerante', 'Gases refrigerantes diversos', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 7),
(gen_random_uuid(), 'Isolamentos', 'isolamentos', 'Materiais de isolamento térmico', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 8),
(gen_random_uuid(), 'Maçaricos', 'macaricos', 'Maçaricos para soldagem', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 9),
(gen_random_uuid(), 'Peças de Reposição', 'pecas-reposicao', 'Peças de reposição diversas', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 10),
(gen_random_uuid(), 'Tubos de Cobre', 'tubos-cobre', 'Tubos de cobre para refrigeração', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 11),
(gen_random_uuid(), 'Unidades Condensadoras', 'unidades-condensadoras', 'Unidades condensadoras completas', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 12),
(gen_random_uuid(), 'Válvulas', 'valvulas', 'Válvulas para refrigeração', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 13),
(gen_random_uuid(), 'Ventiladores', 'ventiladores', 'Ventiladores para refrigeração', (SELECT id FROM categories WHERE slug = 'pecas-componentes-refrigeracao'), false, 1, 14);

-- Atualizar a tabela products para incluir subcategory_id
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES categories(id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);

-- Conceder permissões para os roles anon e authenticated
GRANT SELECT ON categories TO anon;
GRANT ALL PRIVILEGES ON categories TO authenticated;
GRANT SELECT ON products TO anon;
GRANT ALL PRIVILEGES ON products TO authenticated;