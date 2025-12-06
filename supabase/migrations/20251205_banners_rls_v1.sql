DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='banners' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.banners', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de banners ativos" ON public.banners
  FOR SELECT TO public
  USING (active = true);

CREATE POLICY "Insert de banners por autenticados" ON public.banners
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Update de banners por autenticados" ON public.banners
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Delete de banners por autenticados" ON public.banners
  FOR DELETE TO authenticated
  USING (true);

GRANT SELECT ON TABLE public.banners TO anon;
GRANT ALL PRIVILEGES ON TABLE public.banners TO authenticated;
