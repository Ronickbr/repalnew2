-- Criar políticas mais abrangentes para storage
-- Permitir todas as operações no bucket 'products' para usuários autenticados

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir upload de imagens para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura pública de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de imagens para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de imagens para usuários autenticados" ON storage.objects;

-- Política mais permissiva para INSERT (upload)
CREATE POLICY "Permitir upload completo para autenticados" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'products');

-- Política para SELECT (leitura)
CREATE POLICY "Permitir leitura completa para todos" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'products');

-- Política para UPDATE (atualização)
CREATE POLICY "Permitir atualização para autenticados" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'products')
WITH CHECK (bucket_id = 'products');

-- Política para DELETE (exclusão)
CREATE POLICY "Permitir exclusão para autenticados" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'products');

-- Verificar e garantir que o bucket está configurado corretamente
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif'];

-- Verificar políticas atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';