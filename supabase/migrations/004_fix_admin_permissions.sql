-- Corrigir permissões para tabelas admin

-- Garantir que a tabela site_settings tenha RLS desabilitado (já está correto)
-- Mas vamos adicionar políticas para admin_users se necessário

-- Verificar e corrigir permissões para admin_users
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO anon;

-- Verificar e corrigir permissões para banners
GRANT SELECT, INSERT, UPDATE, DELETE ON banners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON banners TO anon;

-- Verificar e corrigir permissões para site_settings
GRANT SELECT, INSERT, UPDATE, DELETE ON site_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON site_settings TO anon;

-- Adicionar políticas mais permissivas para admin_users (temporariamente)
DROP POLICY IF EXISTS "Allow authenticated read on admin_users" ON admin_users;
CREATE POLICY "Allow authenticated read on admin_users" ON admin_users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated update on admin_users" ON admin_users;
CREATE POLICY "Allow authenticated update on admin_users" ON admin_users
  FOR UPDATE USING (true);

-- Adicionar políticas mais permissivas para banners
DROP POLICY IF EXISTS "Allow authenticated read on banners" ON banners;
CREATE POLICY "Allow authenticated read on banners" ON banners
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on banners" ON banners;
CREATE POLICY "Allow authenticated insert on banners" ON banners
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on banners" ON banners;
CREATE POLICY "Allow authenticated update on banners" ON banners
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete on banners" ON banners;
CREATE POLICY "Allow authenticated delete on banners" ON banners
  FOR DELETE USING (true);

-- Permitir acesso público de leitura aos banners ativos
DROP POLICY IF EXISTS "Allow public read active banners" ON banners;
CREATE POLICY "Allow public read active banners" ON banners
  FOR SELECT USING (active = true);