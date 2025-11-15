-- Verificar permissões atuais
SELECT 
    schemaname,
    tablename,
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE grantee IN ('anon', 'authenticated') 
    AND schemaname = 'storage'
ORDER BY schemaname, tablename, grantee;

-- Verificar políticas atuais
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'storage' 
ORDER BY tablename, policyname;