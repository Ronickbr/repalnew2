-- Corrigir políticas de segurança para storage de imagens
-- Estas políticas garantem que usuários autenticados possam fazer upload de imagens

-- Criar política para permitir upload de imagens no bucket 'products'
CREATE POLICY "Permitir upload de imagens de produtos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] = 'images'
);

-- Criar política para permitir leitura de imagens públicas
CREATE POLICY "Permitir leitura pública de imagens" ON storage.objects
FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'products'
);

-- Criar política para permitir exclusão de imagens próprias
CREATE POLICY "Permitir exclusão de imagens de produtos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] = 'images'
);