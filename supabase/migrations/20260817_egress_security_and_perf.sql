-- ==========================================================================
-- 20260817_egress_security_and_perf.sql
--
-- Aplica as correções finais do plano de REDUÇÃO DE TRÁFEGO (egress):
--   1) ÍNDICES para catálogo público, home destacada e activity_logs
--   2) SEGURANÇA: remover leitura anônima de activity_logs e colunas privadas
--   3) VIEWS de agregação para dashboard (evitar baixar 50k linhas)
--   4) RETENÇÃO de activity_logs (180 dias) + job pg_cron (se habilitado)
--
-- Idempotente: pode ser executado múltiplas vezes sem efeito colateral.
-- Execute no SQL Editor do Supabase (produção e staging).
-- ==========================================================================

-- ==========================================================================
-- BLOCO 1 — ÍNDICES DE PERFORMANCE
-- ==========================================================================

-- Catálogo público (home, categoria, subcategoria, paginação)
CREATE INDEX IF NOT EXISTS idx_products_public_catalog
  ON public.products (active, is_disabled, category_id, subcategory_id, created_at DESC);

-- Detalhe por slug (apenas ativos)
CREATE INDEX IF NOT EXISTS idx_products_active_slug
  ON public.products (slug)
  WHERE active = true;

-- Home destacada (featured_on_homepage / featured)
CREATE INDEX IF NOT EXISTS idx_products_home_featured
  ON public.products (featured_on_homepage DESC NULLS LAST, featured DESC NULLS LAST, created_at DESC)
  WHERE active = true AND is_disabled = false;

-- Destaques do menu dropdown
CREATE INDEX IF NOT EXISTS idx_products_dropdown_featured
  ON public.products (featured_in_dropdown DESC NULLS LAST, created_at DESC)
  WHERE active = true AND is_disabled = false;

-- Contagem e agregações de activity_logs por ação+data
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_created_at
  ON public.activity_logs (action, created_at DESC);

-- Produtos mais vistos / filtros por recurso + ação
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_action_created_at
  ON public.activity_logs (resource_id, action, created_at DESC);

-- Atualizar estatísticas do planner após criar índices
ANALYZE public.products;
ANALYZE public.activity_logs;

-- ==========================================================================
-- BLOCO 2 — SEGURANÇA E RLS
-- ==========================================================================

-- Garantir RLS habilitado nas tabelas críticas
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['site_settings','activity_logs','leads','users','admin_users','products','categories','banners'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- --------------------------------------------------------------------------
-- 2A) site_settings: anon/authenticated NÃO PODEM LER colunas privadas
-- --------------------------------------------------------------------------
-- RLS filtra por LINHAS, não por colunas. A proteção de colunas sensíveis
-- (integrations = JSONB com gemini_api_key, tokens MP etc) é feita via
-- REVOKE/GRANT de colunas.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='site_settings') THEN

    -- Revoga SELECT em colunas INTEGRAS para anon e authenticated
    -- (e depois re-concede apenas as colunas públicas explicitamente)
    IF EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE grantee IN ('anon','authenticated')
        AND table_schema='public' AND table_name='site_settings' AND privilege_type='SELECT'
    ) THEN
      REVOKE SELECT ON public.site_settings FROM anon, authenticated;
    END IF;

    -- Concede SELECT SÓ nas colunas públicas.
    -- integrations, updated_by, created_by e quaisquer chaves ficam indisponíveis.
    GRANT SELECT (id, site_info, maintenance, theme, contact, social_media, seo, updated_at, created_at)
      ON public.site_settings TO anon, authenticated;

  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 2B) activity_logs: anon NÃO PODE FAZER SELECT (só INSERT restrito)
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='activity_logs') THEN

    -- Remove políticas antigas que davam SELECT a anon.
    DROP POLICY IF EXISTS anon_select_activity_logs           ON public.activity_logs;
    DROP POLICY IF EXISTS anon_can_select_activity_logs       ON public.activity_logs;
    DROP POLICY IF EXISTS anon_can_insert_activity_logs      ON public.activity_logs;
    DROP POLICY IF EXISTS anon_insert_activity_logs          ON public.activity_logs;

    -- INSERT restrito a ações públicas válidas (whitelist)
    CREATE POLICY anon_insert_activity_logs
      ON public.activity_logs
      FOR INSERT
      TO anon
      WITH CHECK (
        action IN ('product_view','site_visit','whatsapp_click')
        AND resource_type IN ('product','site','store')
        AND COALESCE(resource_id, '') <> ''
      );

    -- Authenticated (admin): pode ler e inserir todas as ações (inclui login, admin_*)
    DROP POLICY IF EXISTS auth_select_activity_logs ON public.activity_logs;
    DROP POLICY IF EXISTS auth_insert_activity_logs ON public.activity_logs;
    CREATE POLICY auth_select_activity_logs
      ON public.activity_logs FOR SELECT TO authenticated USING (true);
    CREATE POLICY auth_insert_activity_logs
      ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 2C) leads / admin_users / users: anon NÃO PODEM LER
-- --------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['admin_users','users','leads'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('DROP POLICY IF EXISTS anon_select_%I   ON public.%I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS anon_can_select_%I ON public.%I', t, t);
    END IF;
  END LOOP;
END $$;

-- ==========================================================================
-- BLOCO 3 — AGREGAÇÕES PARA O DASHBOARD (evita baixar 50k linhas)
-- ==========================================================================

-- Resumo geral dos últimos 30 dias (KPIs principais)
CREATE OR REPLACE VIEW public.dashboard_action_summary_30d AS
SELECT
  action,
  COUNT(*)                                                              AS total,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')     AS last_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')       AS last_7d,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')      AS last_30d
FROM public.activity_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY action
ORDER BY last_30d DESC NULLS LAST;

-- Top 20 produtos mais vistos nos últimos 30 dias
CREATE OR REPLACE VIEW public.dashboard_top_products_30d AS
SELECT
  resource_id,
  MAX(p.name)                                 AS product_name,
  MAX(p.slug)                                 AS product_slug,
  COUNT(*)                                    AS views,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS last_7d_views
FROM public.activity_logs al
LEFT JOIN public.products p ON p.id = CASE WHEN resource_id ~ '^\d+$' THEN resource_id::bigint ELSE NULL END
WHERE action = 'product_view'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY resource_id
ORDER BY views DESC
LIMIT 20;

-- Série temporal de visitas por dia (30 dias) para gráfico
CREATE OR REPLACE VIEW public.dashboard_visits_daily_30d AS
SELECT
  DATE_TRUNC('day', created_at)::date  AS day,
  COUNT(*) FILTER (WHERE action='site_visit')      AS site_visits,
  COUNT(*) FILTER (WHERE action='product_view')    AS product_views,
  COUNT(*) FILTER (WHERE action='whatsapp_click')  AS whatsapp_clicks
FROM public.activity_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 ASC;

-- ==========================================================================
-- BLOCO 4 — RETENÇÃO DE ACTIVITY_LOGS (180 dias)
-- ==========================================================================

-- Purge manual (executa imediatamente, seguro para rodar múltiplas vezes)
DELETE FROM public.activity_logs
WHERE created_at < NOW() - INTERVAL '180 days';

-- Retenção via pg_cron (SE a extensão estiver habilitada no projeto).
-- Verificar em SQL Editor: SELECT * FROM pg_extension WHERE extname='pg_cron';
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN

    PERFORM cron.unschedule('purge_activity_logs_180d')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge_activity_logs_180d');

    PERFORM cron.schedule(
      'purge_activity_logs_180d',
      '0 3 * * 0',                      -- todo domingo às 03:00 (UTC)
      $$ DELETE FROM public.activity_logs WHERE created_at < NOW() - INTERVAL '180 days'; $$
    );
  END IF;
END $$;

-- ==========================================================================
-- BLOCO 5 — CONSULTAS DE VERIFICAÇÃO / SAÚDE
-- ==========================================================================

-- 5a) Quantidade de produtos ativos
-- SELECT count(*) FROM public.products WHERE active = true;

-- 5b) Tamanho lógico dos buckets
-- SELECT
--   bucket_id,
--   count(*)                                                         AS object_count,
--   pg_size_pretty(sum(coalesce((metadata->>'size')::bigint, 0)))   AS logical_size,
--   max(coalesce((metadata->>'size')::bigint, 0))                   AS largest_object_bytes
-- FROM storage.objects
-- GROUP BY bucket_id
-- ORDER BY sum(coalesce((metadata->>'size')::bigint, 0)) DESC;

-- 5c) Eventos por tipo (última semana / 24h)
-- SELECT
--   action,
--   count(*) AS total,
--   count(*) FILTER (WHERE created_at >= now() - interval '24 hours') AS last_24h,
--   count(*) FILTER (WHERE created_at >= now() - interval '7 days')   AS last_7d
-- FROM public.activity_logs
-- GROUP BY action
-- ORDER BY last_7d DESC NULLS LAST;

-- 5d) Verificar colunas acessíveis para 'anon' em site_settings (deve falhar integrations)
-- SELECT grantee, column_name, privilege_type
-- FROM information_schema.role_column_grants
-- WHERE table_schema='public' AND table_name='site_settings' AND grantee='anon'
-- ORDER BY column_name;

COMMIT;
