-- Create banners table for rotative banner system
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_banners_active_sort ON public.banners(active, sort_order);

-- Enable RLS (Row Level Security)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Create policies for banners table
-- Allow public read access for active banners
CREATE POLICY "Allow public read access for active banners" ON public.banners
  FOR SELECT USING (active = true);

-- Allow authenticated users to read all banners (for admin)
CREATE POLICY "Allow authenticated users to read all banners" ON public.banners
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert banners
CREATE POLICY "Allow authenticated users to insert banners" ON public.banners
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update banners
CREATE POLICY "Allow authenticated users to update banners" ON public.banners
  FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to delete banners
CREATE POLICY "Allow authenticated users to delete banners" ON public.banners
  FOR DELETE TO authenticated USING (true);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.banners TO anon;
GRANT ALL PRIVILEGES ON public.banners TO authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER handle_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample banners for testing
INSERT INTO public.banners (title, image_url, link_url, active, sort_order) VALUES
('Banner Principal', 'https://via.placeholder.com/1200x400/8B0000/FFFFFF?text=Banner+Principal', '/produtos', true, 1),
('Promoção Especial', 'https://via.placeholder.com/1200x400/FF6B35/FFFFFF?text=Promoção+Especial', '/promocoes', true, 2),
('Novos Produtos', 'https://via.placeholder.com/1200x400/004225/FFFFFF?text=Novos+Produtos', '/novidades', true, 3);