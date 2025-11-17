-- Migration para corrigir permissões da tabela product_images
-- Garantir que anon e authenticated roles tenham permissões adequadas

-- Verificar permissões atuais
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'product_images' 
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- Grant permissions for anon role (read only)
GRANT SELECT ON product_images TO anon;

-- Grant full permissions for authenticated role
GRANT ALL PRIVILEGES ON product_images TO authenticated;

-- Grant permissions on sequence for auto-increment ID
GRANT USAGE, SELECT ON SEQUENCE product_images_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE product_images_id_seq TO anon;

-- If RLS is enabled, we would need policies, but since it's disabled, 
-- the above grants should be sufficient

-- Optional: Enable RLS and create policies for better security
-- ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage their own product images
-- CREATE POLICY "authenticated_users_can_manage_product_images" ON product_images
-- FOR ALL USING (
--   EXISTS (
--     SELECT 1 FROM products 
--     WHERE products.id = product_images.product_id 
--     AND products.user_id = auth.uid()
--   )
-- );

-- Policy for public read access
-- CREATE POLICY "public_can_read_product_images" ON product_images
-- FOR SELECT USING (true);