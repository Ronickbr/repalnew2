-- Políticas SEGURAS para o papel 'anon' nas tabelas principais
-- Execute este script no SQL editor do seu projeto Supabase.
--
-- IMPORTANTE: visitantes anônimos recebem APENAS leitura dos dados públicos
-- e inserção restrita em 'leads' e 'activity_logs'.
-- NENHUM anon pode criar, atualizar ou deletar registros.

DO $$
DECLARE t text;
BEGIN
  -- Habilitar RLS nas tabelas relevantes, caso existam
  FOREACH t IN ARRAY ARRAY['banners','categories','products','product_images','brands','promotions','promotion_products','leads','stores','users','admin_users','site_settings','activity_logs'] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('alter table public.%I enable row level security', t);
    END IF;
  END LOOP;

  -- SELECT aberto para dados públicos
  FOREACH t IN ARRAY ARRAY['banners','brands','stores','site_settings','product_images'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('drop policy if exists "anon_select_%s" on public.%I', t, t);
      EXECUTE format('create policy "anon_select_%s" on public.%I for select to anon using (true)', t, t);
    END IF;
  END LOOP;

  -- SELECT restrito: apenas registros ativos
  FOREACH t IN ARRAY ARRAY['categories','products'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('drop policy if exists "anon_select_%s" on public.%I', t, t);
      EXECUTE format('create policy "anon_select_%s" on public.%I for select to anon using (active = true)', t, t);
    END IF;
  END LOOP;

  -- Remover qualquer política de escrita para anon (INSERT/UPDATE/DELETE)
  FOREACH t IN ARRAY ARRAY['banners','categories','products','product_images','brands','promotions','promotion_products','leads','stores','users','admin_users','site_settings','activity_logs'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('drop policy if exists "anon_insert_%s" on public.%I', t, t);
      EXECUTE format('drop policy if exists "anon_update_%s" on public.%I', t, t);
      EXECUTE format('drop policy if exists "anon_delete_%s" on public.%I', t, t);
    END IF;
  END LOOP;

  -- INSERT seguro: leads (nome + email ou phone obrigatórios)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leads') THEN
    EXECUTE 'drop policy if exists "anon_insert_leads" on public.leads';
    EXECUTE 'create policy "anon_insert_leads" on public.leads for insert to anon with check (
      coalesce(name, '''') <> ''''
      and (coalesce(email, '''') <> '''' or coalesce(phone, '''') <> '''')
    )';
  END IF;

  -- INSERT seguro: activity_logs restrito a ações públicas válidas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='activity_logs') THEN
    EXECUTE 'drop policy if exists "anon_insert_activity_logs" on public.activity_logs';
    EXECUTE 'create policy "anon_insert_activity_logs" on public.activity_logs for insert to anon with check (
      action in (''product_view'',''site_visit'',''whatsapp_click'')
      and resource_type in (''product'',''site'',''store'')
      and coalesce(resource_id, '''') <> ''''
    )';
  END IF;
END $$;

-- Observações:
-- - Visitantes anônimos leem apenas dados públicos/ativos.
-- - Nenhum anon possui permissão de escrita em dados administrativos.
