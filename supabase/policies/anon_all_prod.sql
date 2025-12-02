-- Políticas de PRODUÇÃO (seguras) para papel 'anon'
-- Execute este script no SQL editor do Supabase no projeto de produção.

DO $$
DECLARE t text;
BEGIN
  -- Habilitar RLS nas tabelas relevantes, caso existam
  FOREACH t IN ARRAY ARRAY['banners','categories','products','product_images','brands','stores','site_settings','activity_logs','leads'] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('alter table public.%I enable row level security', t);
    END IF;
  END LOOP;

  -- SELECT aberto para dados públicos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='banners') THEN
    EXECUTE 'drop policy if exists "anon_select_banners" on public.banners';
    EXECUTE 'create policy "anon_select_banners" on public.banners for select to anon using (true)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='categories') THEN
    EXECUTE 'drop policy if exists "anon_select_categories" on public.categories';
    EXECUTE 'create policy "anon_select_categories" on public.categories for select to anon using (active = true)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') THEN
    EXECUTE 'drop policy if exists "anon_select_products" on public.products';
    EXECUTE 'create policy "anon_select_products" on public.products for select to anon using (active = true)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='product_images') THEN
    EXECUTE 'drop policy if exists "anon_select_product_images" on public.product_images';
    EXECUTE 'create policy "anon_select_product_images" on public.product_images for select to anon using (true)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='brands') THEN
    EXECUTE 'drop policy if exists "anon_select_brands" on public.brands';
    EXECUTE 'create policy "anon_select_brands" on public.brands for select to anon using (true)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='stores') THEN
    EXECUTE 'drop policy if exists "anon_select_stores" on public.stores';
    EXECUTE 'create policy "anon_select_stores" on public.stores for select to anon using (true)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='site_settings') THEN
    EXECUTE 'drop policy if exists "anon_select_site_settings" on public.site_settings';
    EXECUTE 'create policy "anon_select_site_settings" on public.site_settings for select to anon using (true)';
  END IF;

  -- Analytics: permitir SELECT em activity_logs para agregações do dashboard
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='activity_logs') THEN
    EXECUTE 'drop policy if exists "anon_select_activity_logs" on public.activity_logs';
    EXECUTE 'create policy "anon_select_activity_logs" on public.activity_logs for select to anon using (true)';
  END IF;

  -- INSERT seguro: apenas onde faz sentido
  -- activity_logs: restringe action/resource_type e requer resource_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='activity_logs') THEN
    EXECUTE 'drop policy if exists "anon_insert_activity_logs" on public.activity_logs';
    EXECUTE 'create policy "anon_insert_activity_logs" on public.activity_logs for insert to anon with check (
      action in (''product_view'',''site_visit'',''whatsapp_click'')
      and resource_type in (''product'',''site'',''store'')
      and coalesce(resource_id, '''') <> ''''
    )';
  END IF;

  -- leads: requer nome e pelo menos email ou phone
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leads') THEN
    EXECUTE 'drop policy if exists "anon_insert_leads" on public.leads';
    EXECUTE 'create policy "anon_insert_leads" on public.leads for insert to anon with check (
      coalesce(name, '''') <> ''''
      and (coalesce(email, '''') <> '''' or coalesce(phone, '''') <> '''')
    )';
  END IF;

  -- Nenhum UPDATE/DELETE para anon em produção
END $$;
