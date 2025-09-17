-- Enable RLS (Row Level Security)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  sku VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  weight DECIMAL(8,2),
  dimensions JSONB, -- {"length": 0, "width": 0, "height": 0}
  specifications JSONB, -- Flexible specifications storage
  features TEXT[], -- Array of features
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  message TEXT,
  product_name VARCHAR(255), -- Auto-captured from product page
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  source VARCHAR(100) DEFAULT 'website', -- website, whatsapp, phone, etc.
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, converted, lost
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  assigned_to VARCHAR(255), -- Admin user who handles this lead
  notes TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_product ON leads(product_id);

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Allow public read access on categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on product_images" ON product_images
  FOR SELECT USING (true);

-- Create RLS policies for leads (public can insert, authenticated can manage)
CREATE POLICY "Allow public insert on leads" ON leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read on leads" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');

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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories
INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES
('Fornos Industriais', 'fornos-industriais', 'Fornos de alta performance para cozinhas profissionais', '/images/categories/fornos-industriais.jpg', 1),
('Fritadeiras', 'fritadeiras', 'Fritadeiras elétricas e a gás para uso comercial', '/images/categories/fritadeiras.jpg', 2),
('Chapas e Grelhas', 'chapas-grelhas', 'Chapas e grelhas para preparo de alimentos', '/images/categories/chapas-grelhas.jpg', 3),
('Refrigeração', 'refrigeracao', 'Equipamentos de refrigeração comercial', '/images/categories/refrigeracao.jpg', 4),
('Equipamentos de Apoio', 'equipamentos-apoio', 'Mesas, pias e equipamentos auxiliares', '/images/categories/equipamentos-apoio.jpg', 5);

-- Insert sample products
INSERT INTO products (name, slug, description, short_description, category_id, price, sku, specifications, features, is_featured) VALUES
('Forno Turbo Elétrico 5 Telas', 'forno-turbo-eletrico-5-telas', 'Forno turbo elétrico profissional com 5 telas, ideal para padarias e confeitarias. Sistema de ventilação forçada garante cozimento uniforme.', 'Forno turbo elétrico com 5 telas e ventilação forçada', (SELECT id FROM categories WHERE slug = 'fornos-industriais'), 8500.00, 'FTE-5T-001', '{"potencia": "12kW", "tensao": "220V/380V", "capacidade": "5 telas 60x40cm", "temperatura": "50°C a 300°C"}', ARRAY['Ventilação forçada', 'Controle digital de temperatura', 'Timer programável', 'Porta dupla com vidro', 'Estrutura em aço inox'], true),
('Fritadeira Elétrica 2 Cestos', 'fritadeira-eletrica-2-cestos', 'Fritadeira elétrica profissional com 2 cestos independentes, controle de temperatura individual e sistema de filtragem de óleo.', 'Fritadeira elétrica com 2 cestos independentes', (SELECT id FROM categories WHERE slug = 'fritadeiras'), 3200.00, 'FE-2C-001', '{"potencia": "6kW", "tensao": "220V", "capacidade": "2x8L", "temperatura": "120°C a 190°C"}', ARRAY['2 cestos independentes', 'Controle digital', 'Sistema de filtragem', 'Resistência blindada', 'Estrutura em aço inox'], true),
('Chapa Bifeteira a Gás', 'chapa-bifeteira-gas', 'Chapa bifeteira a gás com superfície lisa e estriada, ideal para preparo de carnes, sanduíches e diversos alimentos.', 'Chapa bifeteira a gás com superfície mista', (SELECT id FROM categories WHERE slug = 'chapas-grelhas'), 2800.00, 'CBG-001', '{"potencia": "24000 BTU/h", "gas": "GLP/GN", "superficie": "60x40cm", "espessura": "15mm"}', ARRAY['Superfície mista (lisa/estriada)', 'Queimadores de alta eficiência', 'Controle individual de chamas', 'Bandeja coletora removível', 'Estrutura robusta'], false);

-- Insert sample product images
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
((SELECT id FROM products WHERE slug = 'forno-turbo-eletrico-5-telas'), '/images/products/forno-turbo-eletrico-5-telas.jpg', 'Forno Turbo Elétrico 5 Telas', 0, true),
((SELECT id FROM products WHERE slug = 'fritadeira-eletrica-2-cestos'), '/images/products/fritadeira-eletrica-2-cestos.jpg', 'Fritadeira Elétrica 2 Cestos', 0, true),
((SELECT id FROM products WHERE slug = 'chapa-bifeteira-gas'), '/images/products/chapa-bifeteira-gas.jpg', 'Chapa Bifeteira a Gás', 0, true);

-- Insert sample leads
INSERT INTO leads (name, email, phone, company, message, product_name, status, source) VALUES
('João Silva', 'joao@restaurante.com', '11999887766', 'Restaurante Bom Sabor', 'Interessado no forno turbo elétrico para nossa cozinha', 'Forno Turbo Elétrico 5 Telas', 'new', 'website'),
('Maria Santos', 'maria@padaria.com', '11888776655', 'Padaria Pão Dourado', 'Preciso de orçamento para fritadeira', 'Fritadeira Elétrica 2 Cestos', 'contacted', 'whatsapp'),
('Carlos Oliveira', 'carlos@lanchonete.com', '11777665544', 'Lanchonete do Carlos', 'Gostaria de saber mais sobre a chapa bifeteira', 'Chapa Bifeteira a Gás', 'qualified', 'phone');