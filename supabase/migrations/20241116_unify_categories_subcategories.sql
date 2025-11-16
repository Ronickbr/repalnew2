-- Migração para unificar categories e subcategories em uma tabela hierárquica
-- Esta migração adiciona parent_id à tabela categories e migra os dados das subcategories

-- 1. Adicionar parent_id à tabela categories
ALTER TABLE public.categories 
ADD COLUMN parent_id INTEGER NULL,
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Criar índice para parent_id
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories USING btree (parent_id);

-- 3. Adicionar constraint de foreign key para parent_id
ALTER TABLE public.categories 
ADD CONSTRAINT fk_categories_parent 
FOREIGN KEY (parent_id) REFERENCES public.categories(id) 
ON UPDATE CASCADE ON DELETE CASCADE;

-- 4. Migrar dados das subcategories para categories com parent_id
INSERT INTO public.categories (name, slug, parent_id, is_active, sort_order, created_at, updated_at)
SELECT 
  s.name,
  s.slug,
  s.category_id as parent_id,
  s.is_active,
  0 as sort_order,
  s.created_at,
  s.updated_at
FROM public.subcategories s;

-- 5. Atualizar products.subcategory_id para apontar para o novo registro em categories
UPDATE public.products p
SET subcategory_id = c.id
FROM public.categories c
WHERE c.parent_id IS NOT NULL 
  AND c.name = (SELECT name FROM public.subcategories WHERE id = p.subcategory_id LIMIT 1);

-- 6. Remover constraint da antiga tabela subcategories
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS fk_products_subcategory;

-- 7. Adicionar constraint temporário para permitir migração
-- (será removido após a migração completa)

-- 8. Criar view para compatibilidade temporária se necessário
-- CREATE OR REPLACE VIEW public.subcategories_view AS
-- SELECT * FROM public.categories WHERE parent_id IS NOT NULL;

-- 9. Atualizar RLS policies se necessário
-- (será feito em migração separada se necessário)

-- 10. Comentário para documentação
COMMENT ON COLUMN public.categories.parent_id IS 'ID da categoria pai. NULL para categorias principais, preenchido para subcategorias';
COMMENT ON COLUMN public.categories.is_active IS 'Indica se a categoria está ativa';
COMMENT ON TABLE public.categories IS 'Tabela unificada de categorias e subcategorias com estrutura hierárquica';