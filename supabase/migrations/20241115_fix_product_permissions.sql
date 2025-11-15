-- Corrigir permissões para tabelas de produtos e imagens
-- Permissões para tabela products
GRANT ALL ON TABLE products TO authenticated;
GRANT SELECT ON TABLE products TO anon;

-- Permissões para tabela product_images
GRANT ALL ON TABLE product_images TO authenticated;
GRANT SELECT ON TABLE product_images TO anon;

-- Verificar permissões atuais
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name IN ('products', 'product_images')
ORDER BY table_name, grantee;