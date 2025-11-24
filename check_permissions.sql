SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND grantee IN ('anon', 'authenticated') 
  AND table_name IN ('categories') 
ORDER BY table_name, grantee;
SELECT * FROM public.categories LIMIT 3;
