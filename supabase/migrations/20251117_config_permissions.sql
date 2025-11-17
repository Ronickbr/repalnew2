-- Verificar permissões atuais da tabela site_settings
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'site_settings' 
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- Conceder permissões de leitura para usuários anônimos (visitantes do site)
GRANT SELECT ON site_settings TO anon;

-- Conceder permissões completas para usuários autenticados (administradores)
GRANT ALL PRIVILEGES ON site_settings TO authenticated;

-- Verificar permissões após configuração
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'site_settings' 
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;