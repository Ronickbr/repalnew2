-- 20260808_restrict_anon_policies.sql
-- Endurece as políticas RLS: remove TODO acesso de escrita para o papel 'anon'
-- e restringe a leitura de dados sensíveis (admin_users, users, leads).
--
-- Idempotente: pode ser executado múltiplas vezes sem efeitos colaterais.
-- Execute este script no SQL editor do projeto Supabase (produção e/ou staging).

DO $$
DECLARE t text;
BEGIN
  -- 1) Remover qualquer política de escrita para anon nas tabelas principais
  FOREACH t IN ARRAY ARRAY['banners','categories','products','product_images','brands','promotions','promotion_products','leads','stores','users','admin_users','site_settings','activity_logs'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('drop policy if exists "anon_insert_%s" on public.%I', t, t);
      EXECUTE format('drop policy if exists "anon_update_%s" on public.%I', t, t);
      EXECUTE format('drop policy if exists "anon_delete_%s" on public.%I', t, t);
    END IF;
  END LOOP;

  -- 2) Remover leitura anon de dados sensíveis
  FOREACH t IN ARRAY ARRAY['admin_users','users','leads'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('drop policy if exists "anon_select_%s" on public.%I', t, t);
    END IF;
  END LOOP;

  -- 3) Garantir SELECT anon apenas para dados públicos (sem filtro de status)
  FOREACH t IN ARRAY ARRAY['banners','brands','stores','site_settings','product_images'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('drop policy if exists "anon_select_%s" on public.%I', t, t);
      EXECUTE format('create policy "anon_select_%s" on public.%I for select to anon using (true)', t, t);
    END IF;
  END LOOP;

  -- 4) SELECT anon restrito a registros ativos
  FOREACH t IN ARRAY ARRAY['categories','products'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('drop policy if exists "anon_select_%s" on public.%I', t, t);
      EXECUTE format('create policy "anon_select_%s" on public.%I for select to anon using (active = true)', t, t);
    END IF;
  END LOOP;

  -- 5) INSERT anon restrito em leads
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leads') THEN
    EXECUTE 'drop policy if exists "anon_insert_leads" on public.leads';
    EXECUTE 'drop policy if exists "anon_can_insert_leads" on public.leads';
    EXECUTE 'create policy "anon_insert_leads" on public.leads for insert to anon with check (
      coalesce(name, '''') <> ''''
      and (coalesce(email, '''') <> '''' or coalesce(phone, '''') <> '''')
    )';
  END IF;

  -- 6) activity_logs: INSERT e SELECT anon restritos a ações públicas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='activity_logs') THEN
    EXECUTE 'drop policy if exists "anon_insert_activity_logs" on public.activity_logs';
    EXECUTE 'drop policy if exists "anon_can_insert_activity_logs" on public.activity_logs';
    EXECUTE 'create policy "anon_insert_activity_logs" on public.activity_logs for insert to anon with check (
      action in (''product_view'',''site_visit'',''whatsapp_click'')
      and resource_type in (''product'',''site'',''store'')
      and coalesce(resource_id, '''') <> ''''
    )';

    EXECUTE 'drop policy if exists "anon_select_activity_logs" on public.activity_logs';
    EXECUTE 'drop policy if exists "anon_can_select_activity_logs" on public.activity_logs';
    EXECUTE 'create policy "anon_select_activity_logs" on public.activity_logs for select to anon using (
      action in (''product_view'',''site_visit'',''whatsapp_click'')
    )';
  END IF;

  -- 7) Garantir que RLS esteja habilitado nas tabelas relevantes
  FOREACH t IN ARRAY ARRAY['banners','categories','products','product_images','brands','leads','stores','users','admin_users','site_settings','activity_logs'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('alter table public.%I enable row level security', t);
    END IF;
  END LOOP;
END $$;
