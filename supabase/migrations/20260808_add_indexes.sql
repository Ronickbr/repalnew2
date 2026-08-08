-- 20260808_add_indexes.sql
-- Adiciona índices para as colunas mais consultadas (performance).
-- Idempotente: usa IF NOT EXISTS.
-- Execute este script no SQL editor do projeto Supabase.

-- products
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products (subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products (active);

-- categories
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories (parent_id);

-- leads
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);

-- activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs (action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_id ON public.activity_logs (resource_id);
