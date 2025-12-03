DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='products' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
  END LOOP;
END $$;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='product_images' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.product_images', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de produtos ativos" ON public.products
  FOR SELECT TO public
  USING (active = true AND (is_disabled IS NULL OR is_disabled = false));

CREATE POLICY "Insert de produtos por autenticados" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Update de produtos por autenticados" ON public.products
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Delete de produtos por autenticados" ON public.products
  FOR DELETE TO authenticated
  USING (true);

GRANT SELECT ON TABLE public.products TO anon;
GRANT ALL PRIVILEGES ON TABLE public.products TO authenticated;

CREATE POLICY "Leitura pública de imagens de produto" ON public.product_images
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Insert de imagens por autenticados" ON public.product_images
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Update de imagens por autenticados" ON public.product_images
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Delete de imagens por autenticados" ON public.product_images
  FOR DELETE TO authenticated
  USING (true);

GRANT SELECT ON TABLE public.product_images TO anon;
GRANT ALL PRIVILEGES ON TABLE public.product_images TO authenticated;
