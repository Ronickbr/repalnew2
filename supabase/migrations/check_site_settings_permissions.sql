-- Verificar e corrigir permissões da tabela site_settings

-- Verificar permissões atuais
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'site_settings' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'site_settings';

-- Conceder permissões básicas se não existirem
GRANT SELECT, INSERT, UPDATE, DELETE ON site_settings TO authenticated;
GRANT SELECT ON site_settings TO anon;

-- Criar políticas RLS se não existirem
DROP POLICY IF EXISTS "Allow authenticated users to read site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow public read access to site_settings" ON site_settings;

CREATE POLICY "Allow public read access to site_settings" ON site_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to read site_settings" ON site_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update site_settings" ON site_settings
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert site_settings" ON site_settings
    FOR INSERT TO authenticated WITH CHECK (true);

-- Verificar se a tabela tem dados
SELECT COUNT(*) as total_records FROM site_settings;
SELECT * FROM site_settings LIMIT 1;