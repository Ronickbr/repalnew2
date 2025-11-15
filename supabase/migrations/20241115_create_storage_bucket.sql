-- Criar bucket 'products' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Garantir permissões para usuários autenticados no bucket
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

-- Políticas de segurança para o bucket products
CREATE POLICY "Permitir leitura pública no bucket products" ON storage.buckets
    FOR SELECT USING (id = 'products');

CREATE POLICY "Permitir operações de usuários autenticados no bucket products" ON storage.buckets
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para objetos do storage
CREATE POLICY "Permitir leitura pública de objetos" ON storage.objects
    FOR SELECT USING (bucket_id = 'products' AND (auth.role() = 'anon' OR auth.role() = 'authenticated'));

CREATE POLICY "Permitir upload de objetos para usuários autenticados" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir update de objetos para usuários autenticados" ON storage.objects
    FOR UPDATE USING (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir delete de objetos para usuários autenticados" ON storage.objects
    FOR DELETE USING (bucket_id = 'products' AND auth.role() = 'authenticated');