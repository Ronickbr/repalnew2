-- Insert sample categories
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
('Fornos Industriais', 'fornos-industriais', 'Fornos de alta performance para cozinhas profissionais', 'Flame', 1),
('Fritadeiras', 'fritadeiras', 'Fritadeiras elétricas e a gás para uso comercial', 'ChefHat', 2),
('Chapas e Grelhas', 'chapas-grelhas', 'Chapas e grelhas para preparo de alimentos', 'Grid3x3', 3),
('Refrigeração', 'refrigeracao', 'Equipamentos de refrigeração comercial', 'Snowflake', 4),
('Equipamentos de Apoio', 'equipamentos-apoio', 'Mesas, pias e equipamentos auxiliares', 'Wrench', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (product_name, slug, description, specifications, benefits, category_id, featured, active) VALUES
('Forno Turbo Elétrico 5 Telas', 'forno-turbo-eletrico-5-telas', 'Forno turbo elétrico profissional com 5 telas, ideal para padarias e confeitarias. Sistema de ventilação forçada garante cozimento uniforme e eficiente.', 'Potência: 12kW | Tensão: 220V/380V | Capacidade: 5 telas 60x40cm | Temperatura: 50°C a 300°C | Dimensões: 80x70x180cm', 'Ventilação forçada para cozimento uniforme, Controle digital de temperatura preciso, Timer programável para diferentes receitas, Porta dupla com vidro temperado, Estrutura robusta em aço inox AISI 304', (SELECT id FROM categories WHERE slug = 'fornos-industriais'), true, true),
('Fritadeira Elétrica 2 Cestos', 'fritadeira-eletrica-2-cestos', 'Fritadeira elétrica profissional com 2 cestos independentes, controle de temperatura individual e sistema de filtragem de óleo avançado.', 'Potência: 6kW | Tensão: 220V | Capacidade: 2x8L | Temperatura: 120°C a 190°C | Dimensões: 60x60x85cm', '2 cestos independentes para diferentes alimentos, Controle digital de temperatura por cesto, Sistema de filtragem automática do óleo, Resistência blindada de alta durabilidade, Estrutura em aço inox com acabamento premium', (SELECT id FROM categories WHERE slug = 'fritadeiras'), true, true),
('Chapa Bifeteira a Gás', 'chapa-bifeteira-gas', 'Chapa bifeteira a gás com superfície lisa e estriada, ideal para preparo de carnes, sanduíches e diversos alimentos em alta produtividade.', 'Potência: 24000 BTU/h | Gás: GLP/GN | Superfície: 60x40cm | Espessura: 15mm | Dimensões: 70x60x85cm', 'Superfície mista (lisa e estriada) para versatilidade, Queimadores de alta eficiência energética, Controle individual de chamas por zona, Bandeja coletora removível para limpeza, Estrutura robusta para uso intensivo', (SELECT id FROM categories WHERE slug = 'chapas-grelhas'), false, true),
('Geladeira Comercial 4 Portas', 'geladeira-comercial-4-portas', 'Geladeira comercial de 4 portas em aço inox, ideal para restaurantes e estabelecimentos de grande porte. Sistema de refrigeração eficiente.', 'Capacidade: 1200L | Tensão: 220V | Temperatura: 0°C a 8°C | Dimensões: 200x70x200cm | Gás: R134a', 'Grande capacidade de armazenamento, 4 portas independentes com vedação hermética, Sistema de refrigeração por convecção forçada, Prateleiras reguláveis em aço inox, Controle digital de temperatura', (SELECT id FROM categories WHERE slug = 'refrigeracao'), true, true),
('Mesa de Apoio Inox', 'mesa-apoio-inox', 'Mesa de apoio em aço inox AISI 304, com prateleira inferior e pés reguláveis. Ideal para preparo e organização da cozinha profissional.', 'Material: Aço Inox AISI 304 | Dimensões: 150x70x85cm | Espessura: 1,2mm | Peso: 45kg', 'Construção em aço inox de alta qualidade, Prateleira inferior para armazenamento, Pés reguláveis para nivelamento, Fácil limpeza e manutenção, Design ergonômico para uso profissional', (SELECT id FROM categories WHERE slug = 'equipamentos-apoio'), false, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample product images
INSERT INTO product_images (product_id, image_url, alt_text, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'forno-turbo-eletrico-5-telas'), '/images/products/forno-turbo-eletrico-5-telas-frontal.jpg', 'Forno Turbo Elétrico 5 Telas - Vista Frontal', 0),
((SELECT id FROM products WHERE slug = 'fritadeira-eletrica-2-cestos'), '/images/products/fritadeira-eletrica-2-cestos-principal.jpg', 'Fritadeira Elétrica 2 Cestos - Vista Principal', 0),
((SELECT id FROM products WHERE slug = 'chapa-bifeteira-gas'), '/images/products/chapa-bifeteira-gas-superficie.jpg', 'Chapa Bifeteira a Gás - Superfície Mista', 0),
((SELECT id FROM products WHERE slug = 'geladeira-comercial-4-portas'), '/images/products/geladeira-comercial-4-portas-frontal.jpg', 'Geladeira Comercial 4 Portas - Vista Frontal', 0),
((SELECT id FROM products WHERE slug = 'mesa-apoio-inox'), '/images/products/mesa-apoio-inox-lateral.jpg', 'Mesa de Apoio Inox - Vista Lateral', 0);

-- Insert sample leads
INSERT INTO leads (client_name, phone, email, message, product_name, status) VALUES
('João Silva', '11999887766', 'joao@restaurante.com', 'Interessado no forno turbo elétrico para nossa cozinha. Gostaria de saber mais sobre as especificações técnicas.', 'Forno Turbo Elétrico 5 Telas', 'novo'),
('Maria Santos', '11888776655', 'maria@padaria.com', 'Preciso de orçamento para fritadeira. Nossa padaria está expandindo e precisamos de equipamentos confiáveis.', 'Fritadeira Elétrica 2 Cestos', 'contato'),
('Carlos Oliveira', '11777665544', 'carlos@lanchonete.com', 'Gostaria de saber mais sobre a chapa bifeteira. Qual o prazo de entrega?', 'Chapa Bifeteira a Gás', 'orcado'),
('Ana Costa', '11666554433', 'ana@buffet.com', 'Interessada na geladeira comercial. Vocês fazem instalação?', 'Geladeira Comercial 4 Portas', 'novo'),
('Pedro Almeida', '11555443322', 'pedro@restaurante.net', 'Preciso de uma mesa de apoio para minha cozinha. Vocês têm outras medidas disponíveis?', 'Mesa de Apoio Inox', 'contato');

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
DROP POLICY IF EXISTS "Allow public read access on categories" ON categories;
CREATE POLICY "Allow public read access on categories" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on products" ON products;
CREATE POLICY "Allow public read access on products" ON products
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Allow public read access on product_images" ON product_images;
CREATE POLICY "Allow public read access on product_images" ON product_images
  FOR SELECT USING (true);

-- Create RLS policies for leads (public can insert, authenticated can manage)
DROP POLICY IF EXISTS "Allow public insert on leads" ON leads;
CREATE POLICY "Allow public insert on leads" ON leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read on leads" ON leads;
CREATE POLICY "Allow authenticated read on leads" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update on leads" ON leads;
CREATE POLICY "Allow authenticated update on leads" ON leads
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON categories TO anon;
GRANT SELECT ON products TO anon;
GRANT SELECT ON product_images TO anon;
GRANT INSERT ON leads TO anon;

GRANT ALL PRIVILEGES ON categories TO authenticated;
GRANT ALL PRIVILEGES ON products TO authenticated;
GRANT ALL PRIVILEGES ON product_images TO authenticated;
GRANT ALL PRIVILEGES ON leads TO authenticated;