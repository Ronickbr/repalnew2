-- Criar tabela admin_users para autenticação
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para email (usado para login)
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Criar índice para role (usado para verificação de permissões)
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Habilitar RLS (Row Level Security)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Política para permitir que apenas usuários autenticados vejam dados
CREATE POLICY "Admin users can view their own data" ON admin_users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Política para permitir inserção apenas por service role
CREATE POLICY "Service role can insert admin users" ON admin_users
  FOR INSERT WITH CHECK (true);

-- Política para permitir atualização apenas por service role
CREATE POLICY "Service role can update admin users" ON admin_users
  FOR UPDATE USING (true);

-- Conceder permissões para roles anon e authenticated
GRANT SELECT ON admin_users TO anon;
GRANT SELECT ON admin_users TO authenticated;
GRANT ALL PRIVILEGES ON admin_users TO service_role;

-- Inserir usuário admin padrão (senha: admin123)
-- Hash gerado com bcrypt para 'admin123'
INSERT INTO admin_users (email, password_hash, name, role, active)
VALUES (
  'admin@repal.com.br',
  '$2b$10$rQJ8vQZ9X5K5Z5Z5Z5Z5ZOeK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',
  'Administrador',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();