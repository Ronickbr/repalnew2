-- Corrigir políticas de segurança para storage de imagens
-- Remover políticas antigas e criar novas mais permissivas

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir upload de imagens de produtos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura pública de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de imagens de produtos" ON storage.objects;

-- Criar política mais permissiva para upload
CREATE POLICY "Permitir upload de imagens para usuários autenticados" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'products'
);

-- Criar política para leitura pública de todas as imagens
CREATE POLICY "Permitir leitura pública de imagens" ON storage.objects
FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'products'
);

-- Criar política para exclusão de imagens (usuários autenticados podem excluir)
CREATE POLICY "Permitir exclusão de imagens para usuários autenticados" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'products'
);

-- Criar política para atualização de imagens
CREATE POLICY "Permitir atualização de imagens para usuários autenticados" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'products'
)
WITH CHECK (
  bucket_id = 'products'
);

-- Verificar se o bucket existe e está configurado corretamente
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif'];