-- Garantir que a tabela site_settings existe e tem as permissões corretas

-- Criar a tabela se não existir (caso de segurança)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id SERIAL PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL DEFAULT 'Meu Site',
    site_description TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Allow read access to site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow insert access to site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow update access to site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow delete access to site_settings" ON public.site_settings;

-- Criar políticas RLS para permitir acesso público de leitura e escrita
CREATE POLICY "Allow read access to site_settings" ON public.site_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow insert access to site_settings" ON public.site_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to site_settings" ON public.site_settings
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to site_settings" ON public.site_settings
    FOR DELETE USING (true);

-- Garantir permissões para os roles anon e authenticated
GRANT ALL PRIVILEGES ON public.site_settings TO anon;
GRANT ALL PRIVILEGES ON public.site_settings TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE site_settings_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE site_settings_id_seq TO authenticated;

-- Inserir configurações padrão se a tabela estiver vazia
INSERT INTO public.site_settings (
    site_name,
    site_description,
    meta_title,
    meta_description,
    meta_keywords,
    contact_email,
    contact_phone,
    address
) 
SELECT 
    'Meu Site',
    'Descrição do meu site',
    'Meu Site - Título SEO',
    'Meta descrição para SEO',
    'palavras, chave, seo',
    'contato@meusite.com',
    '(11) 99999-9999',
    'Endereço da empresa'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- Comentário de confirmação
-- Esta migração garante que:
-- 1. A tabela site_settings existe
-- 2. Tem RLS habilitado com políticas permissivas
-- 3. Os roles anon e authenticated têm acesso completo
-- 4. Há pelo menos um registro com dados padrão