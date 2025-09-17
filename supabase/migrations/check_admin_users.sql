-- Verificar dados na tabela admin_users
SELECT id, email, name, role, active, created_at FROM admin_users;

-- Verificar permissões da tabela
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'admin_users' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY grantee, privilege_type;