-- ==========================================================================
-- ETAPA 5 — OBSERVABILIDADE E VERIFICAÇÃO DE EGRESS
-- Arquivo: supabase/migrations/20260817_etapa5_observabilidade.sql
--
-- Objetivo:
--   - Criar VIEWS e RPCs para MEDIR e COMPARAR o egress (API + Storage + Realtime)
--     ANTES e DEPOIS do deploy das correções.
--   - Registrar baseline (antes) para comparação de 7 dias.
--   - Fornecer as consultas de auditoria da seção 15 do correcoes.md.
--
-- Rode uma cópia da VIEW "egress_baseline" ANTES de publicar as correções.
-- Depois, rode os relatórios diários para comparar.
-- ==========================================================================

-- ==========================================================================
-- 5.1) Garantir extensões disponíveis (pg_stat_statements é essencial)
-- ==========================================================================
-- Algumas extensões já vêm habilitadas no Supabase. Rode apenas para confirmar.
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ==========================================================================
-- 5.2) Baseline: snapshot ANTES vs DEPOIS para comparação de 7 dias
-- ==========================================================================

-- Tabela que guarda snapshots (executados manualmente antes e depois)
CREATE TABLE IF NOT EXISTS public.egress_snapshots (
  id              bigserial PRIMARY KEY,
  snapshot_at     timestamptz NOT NULL DEFAULT NOW(),
  label           text        NOT NULL,           -- 'baseline-before' / 'day-1-after' / 'day-7-after'
  metric_name     text        NOT NULL,           -- 'products_active_count', 'activity_logs_24h', ...
  metric_value    bigint      NOT NULL DEFAULT 0,
  extra           jsonb       NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (label, metric_name)
);

-- ================
-- RPC: capturar baseline
-- ================
CREATE OR REPLACE FUNCTION public.capture_egress_snapshot(p_label text)
RETURNS TABLE (metric_name text, metric_value bigint, note text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $OBSF$
DECLARE
  v_products bigint;
  v_activity_24h bigint;
  v_activity_7d  bigint;
  v_visits_24h   bigint;
  v_product_views_24h bigint;
  v_whatsapp_24h bigint;
  v_bucket_objects bigint;
  v_bucket_bytes bigint;
BEGIN
  -- Limpa entradas do mesmo label para permitir re-fazer
  DELETE FROM public.egress_snapshots WHERE label = p_label;

  -- 1) Contagem de produtos ativos
  SELECT count(*) INTO v_products FROM public.products WHERE active = true;
  INSERT INTO public.egress_snapshots(label, metric_name, metric_value)
  VALUES (p_label, 'products_active_count', v_products);

  -- 2) Activity logs
  SELECT count(*) INTO v_activity_24h
    FROM public.activity_logs
   WHERE created_at >= NOW() - INTERVAL '24 hours';
  SELECT count(*) INTO v_activity_7d
    FROM public.activity_logs
   WHERE created_at >= NOW() - INTERVAL '7 days';

  SELECT count(*) INTO v_visits_24h
    FROM public.activity_logs
   WHERE action = 'site_visit' AND created_at >= NOW() - INTERVAL '24 hours';
  SELECT count(*) INTO v_product_views_24h
    FROM public.activity_logs
   WHERE action = 'product_view' AND created_at >= NOW() - INTERVAL '24 hours';
  SELECT count(*) INTO v_whatsapp_24h
    FROM public.activity_logs
   WHERE action = 'whatsapp_click' AND created_at >= NOW() - INTERVAL '24 hours';

  INSERT INTO public.egress_snapshots(label, metric_name, metric_value) VALUES
    (p_label, 'activity_logs_24h', v_activity_24h),
    (p_label, 'activity_logs_7d',  v_activity_7d),
    (p_label, 'site_visits_24h',   v_visits_24h),
    (p_label, 'product_views_24h', v_product_views_24h),
    (p_label, 'whatsapp_24h',      v_whatsapp_24h);

  -- 3) Storage (tamanho lógico e contagem)
  SELECT count(*), coalesce(sum((metadata->>'size')::bigint), 0)
    INTO v_bucket_objects, v_bucket_bytes
    FROM storage.objects;

  INSERT INTO public.egress_snapshots(label, metric_name, metric_value, extra)
  VALUES
    (p_label, 'storage_object_count', v_bucket_objects, '{}'::jsonb),
    (p_label, 'storage_logical_bytes', v_bucket_bytes, '{"unit":"bytes"}'::jsonb);

  -- Retorna o resumo para o console
  RETURN QUERY
    SELECT s.metric_name, s.metric_value, ''::text
    FROM public.egress_snapshots s
    WHERE s.label = p_label
    ORDER BY s.metric_name;
END;
$OBSF$;

-- Retira execução pública (só service_role / superuser / authenticated admin)
REVOKE ALL ON FUNCTION public.capture_egress_snapshot(text) FROM PUBLIC;
REVOKE ALL ON TABLE public.egress_snapshots FROM anon;

-- ==========================================================================
-- 5.3) Views de relatório diário (para comparar após 7 dias)
-- ==========================================================================

-- Ação por dia, últimos 14 dias
CREATE OR REPLACE VIEW public.report_actions_daily_14d AS
SELECT
  DATE_TRUNC('day', created_at)::date                                 AS day,
  action,
  count(*)                                                            AS events
FROM public.activity_logs
WHERE created_at >= NOW() - INTERVAL '14 days'
GROUP BY 1, 2
ORDER BY 1 ASC, 2 ASC;

-- Comparação snapshots: antes vs depois
CREATE OR REPLACE VIEW public.report_egress_compare AS
SELECT
  metric_name,
  max(value_before)                                                    AS value_before,
  max(value_after)                                                     AS value_after,
  CASE
    WHEN max(value_before) = 0 THEN NULL
    ELSE round(100.0 * (max(value_after) - max(value_before)) / max(value_before)::numeric, 2)
  END                                                                  AS pct_change
FROM (
  SELECT metric_name,
         metric_value AS value_before, NULL::bigint AS value_after
  FROM public.egress_snapshots WHERE label = 'baseline-before'
  UNION ALL
  SELECT metric_name,
         NULL::bigint, metric_value
  FROM public.egress_snapshots WHERE label = 'day-7-after'
) t
GROUP BY metric_name
ORDER BY metric_name;

-- ==========================================================================
-- 5.4) Consultas pg_stat_statements (top consultas por produtos/settings/logs)
-- ==========================================================================
-- Esta seção NÃO cria view permanente por segurança.
-- Use o bloco abaixo diretamente no SQL Editor:
--
-- SELECT
--   query,
--   calls,
--   rows,
--   round(total_exec_time::numeric, 2) AS total_exec_time_ms,
--   round(total_exec_time / NULLIF(calls, 0)::numeric, 2) AS avg_ms_per_call
-- FROM pg_stat_statements
-- WHERE query ILIKE '%products%'
--    OR query ILIKE '%site_settings%'
--    OR query ILIKE '%banners%'
--    OR query ILIKE '%activity_logs%'
-- ORDER BY calls DESC
-- LIMIT 30;
--
-- Opcionalmente: RESET do pg_stat_statements APÓS capturar baseline
-- SELECT pg_stat_statements_reset();

-- ==========================================================================
-- 5.5) Relatórios rápidos (todos os SELECT do correcoes.md, seção 15)
-- ==========================================================================
-- Para usar como views rápidas:

CREATE OR REPLACE VIEW public.check_product_active_count AS
SELECT count(*)::bigint AS product_active_count
FROM public.products
WHERE active = true;

CREATE OR REPLACE VIEW public.check_bucket_logical_size AS
SELECT
  bucket_id,
  count(*)                                                                    AS object_count,
  pg_size_pretty(sum(coalesce((metadata->>'size')::bigint, 0)))::text         AS logical_size,
  max(coalesce((metadata->>'size')::bigint, 0))                               AS largest_object_bytes
FROM storage.objects
GROUP BY bucket_id
ORDER BY sum(coalesce((metadata->>'size')::bigint, 0)) DESC NULLS LAST;

CREATE OR REPLACE VIEW public.check_activity_by_type AS
SELECT
  action,
  count(*)                                                                    AS total,
  count(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')           AS last_24h,
  count(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')             AS last_7d
FROM public.activity_logs
GROUP BY action
ORDER BY last_7d DESC NULLS LAST;

-- ==========================================================================
-- 5.6) COMO USAR ESTA MIGRATION (passo a passo):
-- ==========================================================================
-- PASSO 1 (ANTES de publicar as correções):
--   SELECT * FROM public.capture_egress_snapshot('baseline-before');
--
-- PASSO 2 (1 dia após o deploy):
--   SELECT * FROM public.capture_egress_snapshot('day-1-after');
--
-- PASSO 3 (7 dias após o deploy — meta do correcoes.md):
--   SELECT * FROM public.capture_egress_snapshot('day-7-after');
--   SELECT * FROM public.report_egress_compare;
--   SELECT * FROM public.report_actions_daily_14d;
--
-- PASSO 4 (storage):
--   SELECT * FROM public.check_bucket_logical_size;
--   SELECT * FROM public.storage_top_heavy_objects   WHERE size_bytes > 500*1024;
--   SELECT * FROM public.storage_objects_missing_cache;
--
-- PASSO 5 (pg_stat_statements - APÓS deploy):
--   (cole o SELECT da seção 5.4 acima)
COMMIT;
