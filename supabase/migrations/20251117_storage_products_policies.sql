-- Políticas de segurança para o bucket 'products' permitindo upload de imagens base64

-- Permitir que usuários autenticados façam upload de arquivos no bucket 'products'
CREATE POLICY "Permitir upload de imagens para usuários autenticados" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'products');

-- Permitir que usuários autenticados visualizem arquivos no bucket 'products'
CREATE POLICY "Permitir visualização de imagens para usuários autenticados" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'products');

-- Permitir que usuários autenticados atualizem arquivos no bucket 'products'
CREATE POLICY "Permitir atualização de imagens para usuários autenticados" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'products')
WITH CHECK (bucket_id = 'products');

-- Permitir que usuários autenticados excluam arquivos no bucket 'products'
CREATE POLICY "Permitir exclusão de imagens para usuários autenticados" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'products');

-- Permitir acesso anônimo para visualização de imagens (para exibição pública)
CREATE POLICY "Permitir visualização pública de imagens" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'products');

-- Garantir que o bucket 'products' existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];