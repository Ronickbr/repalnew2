-- Migration para corrigir políticas de segurança do Supabase Storage
-- Criar bucket 'products' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir upload de imagens para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura pública de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload anônimo de imagens" ON storage.objects;

-- Criar política para permitir upload de imagens para usuários autenticados
CREATE POLICY "Permitir upload de imagens para usuários autenticados" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] = 'product-images' OR 
   storage.foldername(name) @> ARRAY['brand-logos']
);

-- Criar política para permitir upload anônimo de imagens (para casos específicos)
CREATE POLICY "Permitir upload anônimo de imagens" ON storage.objects
FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] = 'product-images' OR 
   storage.foldername(name) @> ARRAY['brand-logos']
);

-- Criar política para permitir leitura pública de todas as imagens
CREATE POLICY "Permitir leitura pública de imagens" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'products');

-- Criar política para permitir exclusão de imagens pelo usuário que as criou
CREATE POLICY "Permitir exclusão de imagens pelo proprietário" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'products' AND
  auth.uid() = owner
);

-- Criar política para permitir atualização de imagens pelo usuário que as criou
CREATE POLICY "Permitir atualização de imagens pelo proprietário" ON storage.objects
FOR UPDATE TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  auth.uid() = owner
);

-- Conceder permissões necessárias
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon;
GRANT ALL ON storage.buckets TO authenticated;