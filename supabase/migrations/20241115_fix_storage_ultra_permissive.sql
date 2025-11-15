-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Permitir leitura pública no bucket products" ON storage.buckets;
DROP POLICY IF EXISTS "Permitir operações de usuários autenticados no bucket products" ON storage.buckets;
DROP POLICY IF EXISTS "Permitir leitura pública de objetos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de objetos para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir update de objetos para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir delete de objetos para usuários autenticados" ON storage.objects;

-- Criar políticas ultra-permissivas para resolver o problema
CREATE POLICY "Permitir tudo para todos no bucket" ON storage.buckets
    FOR ALL USING (true);

CREATE POLICY "Permitir todas operações em objetos" ON storage.objects
    FOR ALL USING (true);

-- Garantir permissões completas
GRANT ALL ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO service_role;
GRANT ALL ON storage.objects TO service_role;