-- Criar tabela para configurações do site
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  site_name VARCHAR(255) NOT NULL DEFAULT 'Meu Site',
  site_description TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO site_settings (
  site_name,
  site_description,
  meta_title,
  meta_description,
  meta_keywords,
  contact_email,
  contact_phone,
  address
) VALUES (
  'Repal Representações',
  'Sua empresa de confiança em representações comerciais',
  'Repal Representações - Soluções Comerciais',
  'A Repal oferece as melhores soluções em representações comerciais com qualidade e confiança.',
  'representações, comercial, vendas, produtos, qualidade',
  'contato@repal.com.br',
  '(11) 99999-9999',
  'São Paulo, SP - Brasil'
);

-- Habilitar RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários anônimos
CREATE POLICY "Allow anonymous read access" ON site_settings
  FOR SELECT
  TO anon
  USING (true);

-- Política para permitir todas as operações para usuários autenticados
CREATE POLICY "Allow authenticated full access" ON site_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Conceder permissões
GRANT SELECT ON site_settings TO anon;
GRANT ALL PRIVILEGES ON site_settings TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE site_settings_id_seq TO authenticated;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();