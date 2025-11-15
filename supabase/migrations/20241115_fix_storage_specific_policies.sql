-- Verificar se o bucket existe e criar se necessário
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'products') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('products', 'products', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
    END IF;
END $$;

-- Remover políticas existentes que podem estar causando conflitos
DROP POLICY IF EXISTS "Permitir tudo para todos no bucket" ON storage.buckets;
DROP POLICY IF EXISTS "Permitir todas operações em objetos" ON storage.objects;

-- Criar políticas específicas para o bucket products
CREATE POLICY "Permitir leitura pública em products" ON storage.objects
    FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Permitir upload para usuários autenticados em products" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.uid() IS NOT NULL);

CREATE POLICY "Permitir update para usuários autenticados em products" ON storage.objects
    FOR UPDATE USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);

CREATE POLICY "Permitir delete para usuários autenticados em products" ON storage.objects
    FOR DELETE USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);

-- Garantir que o bucket seja público
UPDATE storage.buckets SET public = true WHERE id = 'products';

-- Verificar e garantir permissões
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;