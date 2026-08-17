-- ==========================================================================
-- ETAPA 4 — OTIMIZAÇÃO DE MÍDIA (storage + upload + cache)
-- Arquivo: supabase/migrations/20260817_etapa4_midia.sql
--
-- O que faz (TUDO seguro/idempotente):
--   1) Atualiza cacheControl PARA ARQUIVOS JÁ EXISTENTES nos buckets públicos
--      (imagens versionadas: banners, products, logos, etc.).
--   2) Cria VIEWS de auditoria para identificar:
--        - maiores arquivos por bucket
--        - arquivos sem cache
--        - tamanho lógico por bucket (meta: banners < 20 MB / products < 50 MB)
--   3) Lista REGRAS de limite de upload que devem ser configuradas
--      NO CONSOLE DO SUPABASE (Storage → Buckets → Policies).
--
-- Parte do documento: seções 6.3 (Upload e cache) + 6.4 (Limites de arquivo)
-- ==========================================================================

-- ==========================================================================
-- 4.1) Atualizar cacheControl dos arquivos JÁ EXISTENTES em buckets públicos
-- ==========================================================================
-- Alvo: banners, products, categories, logos, icons, public.
-- Regra:
--   - NOME VERSIONADO (ex: produto-123-v2.webp, banner-jul-2026.png) → 1 ano (31536000)
--   - NOME FIXO que pode ser re-uploadado (ex: logo.png) → 1 hora (3600)
--
-- Atualização conservadora abaixo: aplica 1 ano a banners/products (normalmente
-- versionados) e 1 dia a buckets de logo/icones (podem ser sobrescritos).
-- Ajuste os nomes de bucket conforme projeto Repal.

DO $MIDIA$
DECLARE
  bucket_pattern text;
BEGIN
  -- Bucket "banners" (se existir) → 1 ano (normalmente nome único por campanha)
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'banners') THEN
    UPDATE storage.objects
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('cacheControl', 'public, max-age=31536000, immutable')
    WHERE bucket_id = 'banners'
      AND COALESCE(metadata->>'cacheControl', '') NOT LIKE '%immutable%';
  END IF;

  -- Bucket "products" (se existir) → 1 ano (hash / id do produto no nome)
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'products') THEN
    UPDATE storage.objects
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('cacheControl', 'public, max-age=31536000, immutable')
    WHERE bucket_id = 'products'
      AND COALESCE(metadata->>'cacheControl', '') NOT LIKE '%immutable%';
  END IF;

  -- Bucket "categories" → 1 ano
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'categories') THEN
    UPDATE storage.objects
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('cacheControl', 'public, max-age=31536000, immutable')
    WHERE bucket_id = 'categories'
      AND COALESCE(metadata->>'cacheControl', '') NOT LIKE '%immutable%';
  END IF;

  -- Buckets genéricos "public", "logos", "icons", "uploads" → 24h (menos seguro sobrescrever)
  FOREACH bucket_pattern IN ARRAY ARRAY['public','logos','icons','uploads'] LOOP
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = bucket_pattern) THEN
      UPDATE storage.objects
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('cacheControl', 'public, max-age=86400')
      WHERE bucket_id = bucket_pattern
        AND COALESCE(metadata->>'cacheControl', '') = '';
    END IF;
  END LOOP;
END $MIDIA$;

-- ==========================================================================
-- 4.2) VIEWS de auditoria / saúde dos buckets
-- ==========================================================================

-- Visão geral por bucket
CREATE OR REPLACE VIEW public.storage_bucket_health AS
SELECT
  b.id                                                            AS bucket_id,
  b.public                                                        AS is_public,
  count(o.id)                                                     AS object_count,
  pg_size_pretty(
    coalesce(sum((o.metadata->>'size')::bigint), 0)
  )::text                                                         AS logical_size,
  coalesce(sum((o.metadata->>'size')::bigint), 0)                 AS logical_bytes,
  pg_size_pretty(
    coalesce(max((o.metadata->>'size')::bigint), 0)
  )::text                                                         AS largest_object,
  coalesce(max((o.metadata->>'size')::bigint), 0)                 AS largest_bytes,
  count(o.id) FILTER (
    WHERE coalesce(o.metadata->>'cacheControl', '') = ''
  )                                                               AS without_cachecontrol
FROM storage.buckets b
LEFT JOIN storage.objects o ON o.bucket_id = b.id
GROUP BY b.id, b.public
ORDER BY logical_bytes DESC NULLS LAST;

-- Top 50 maiores arquivos (priorizar conversão para WebP)
CREATE OR REPLACE VIEW public.storage_top_heavy_objects AS
SELECT
  bucket_id,
  name,
  pg_size_pretty(coalesce((metadata->>'size')::bigint, 0))::text  AS size,
  coalesce((metadata->>'size')::bigint, 0)                        AS size_bytes,
  coalesce(metadata->>'mimetype', '')                             AS mime,
  coalesce(metadata->>'cacheControl', '')                         AS cache_control,
  created_at,
  last_accessed_at
FROM storage.objects
ORDER BY size_bytes DESC NULLS LAST
LIMIT 50;

-- Arquivos SEM cache-control definido
CREATE OR REPLACE VIEW public.storage_objects_missing_cache AS
SELECT
  bucket_id,
  name,
  pg_size_pretty(coalesce((metadata->>'size')::bigint, 0))::text  AS size,
  coalesce(metadata->>'mimetype', '')                             AS mime,
  created_at
FROM storage.objects
WHERE coalesce(metadata->>'cacheControl', '') = ''
ORDER BY bucket_id, coalesce((metadata->>'size')::bigint, 0) DESC NULLS LAST;

-- ==========================================================================
-- 4.3) CONSULTAS de verificação de saúde (rodar após aplicar)
-- ==========================================================================
-- SELECT * FROM public.storage_bucket_health;
-- SELECT * FROM public.storage_top_heavy_objects WHERE size_bytes > 500 * 1024;   -- > 500 KB
-- SELECT * FROM public.storage_objects_missing_cache;
-- SELECT count(*) FROM storage.objects WHERE lower(name) LIKE '%.webp';          -- quantos já são WebP?

COMMIT;
