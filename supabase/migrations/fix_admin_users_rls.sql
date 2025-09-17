-- Desabilitar RLS temporariamente para inserir dados iniciais
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Inserir usuário administrador inicial
INSERT INTO admin_users (email, password_hash, name, role, active) 
VALUES ('admin@repal.com.br', 'admin123', 'Administrador', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Reabilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para admin_users
-- Política para permitir SELECT para usuários autenticados
CREATE POLICY "Allow authenticated users to read admin_users" ON admin_users
    FOR SELECT
    USING (true);

-- Política para permitir INSERT para usuários autenticados (para criação de novos admins)
CREATE POLICY "Allow authenticated users to insert admin_users" ON admin_users
    FOR INSERT
    WITH CHECK (true);

-- Política para permitir UPDATE para usuários autenticados
CREATE POLICY "Allow authenticated users to update admin_users" ON admin_users
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Política para permitir DELETE para usuários autenticados
CREATE POLICY "Allow authenticated users to delete admin_users" ON admin_users
    FOR DELETE
    USING (true);

-- Garantir permissões para roles anon e authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;

-- Verificar se o usuário foi criado
SELECT id, email, name, role, active, created_at FROM admin_users WHERE email = 'admin@repal.com.br';