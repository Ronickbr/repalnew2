-- Políticas permissivas para o papel 'anon' em todas as tabelas principais
-- Execute este script no SQL editor do seu projeto Supabase.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['banners','categories','products','product_images','brands','promotions','promotion_products','leads','stores','users','admin_users','site_settings','activity_logs'] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('alter table public.%I enable row level security', t);

      EXECUTE format('drop policy if exists "anon_select_%s" on public.%I', t, t);
      EXECUTE format('create policy "anon_select_%s" on public.%I for select to anon using (true)', t, t);

      EXECUTE format('drop policy if exists "anon_insert_%s" on public.%I', t, t);
      EXECUTE format('create policy "anon_insert_%s" on public.%I for insert to anon with check (true)', t, t);

      EXECUTE format('drop policy if exists "anon_update_%s" on public.%I', t, t);
      EXECUTE format('create policy "anon_update_%s" on public.%I for update to anon using (true) with check (true)', t, t);

      EXECUTE format('drop policy if exists "anon_delete_%s" on public.%I', t, t);
      EXECUTE format('create policy "anon_delete_%s" on public.%I for delete to anon using (true)', t, t);
    END IF;
  END LOOP;
END $$;

-- Atenção: estas políticas são extremamente permissivas e devem ser restritas em produção.
