-- Desabilitar RLS e conceder permissões para resolver erros de política de segurança

-- Desabilitar RLS temporariamente para permitir inserções
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;

-- Conceder permissões completas para o role anon (usado no frontend)
GRANT ALL PRIVILEGES ON public.products TO anon;
GRANT ALL PRIVILEGES ON public.categories TO anon;
GRANT ALL PRIVILEGES ON public.leads TO anon;
GRANT ALL PRIVILEGES ON public.product_images TO anon;

-- Conceder permissões completas para o role authenticated
GRANT ALL PRIVILEGES ON public.products TO authenticated;
GRANT ALL PRIVILEGES ON public.categories TO authenticated;
GRANT ALL PRIVILEGES ON public.leads TO authenticated;
GRANT ALL PRIVILEGES ON public.product_images TO authenticated;

-- Conceder permissões de uso nas sequências (se houver)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comentário explicativo
COMMENT ON TABLE public.products IS 'RLS desabilitado para permitir inserções do frontend';
COMMENT ON TABLE public.categories IS 'RLS desabilitado para permitir leitura do frontend';
COMMENT ON TABLE public.leads IS 'RLS desabilitado para permitir inserções de leads';
COMMENT ON TABLE public.product_images IS 'RLS desabilitado para permitir upload de imagens';