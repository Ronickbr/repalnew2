DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='brands' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.brands', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de marcas" ON public.brands
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Insert de marcas por autenticados" ON public.brands
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Update de marcas por autenticados" ON public.brands
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Delete de marcas por autenticados" ON public.brands
  FOR DELETE TO authenticated
  USING (true);

GRANT SELECT ON TABLE public.brands TO anon;
GRANT ALL PRIVILEGES ON TABLE public.brands TO authenticated;
