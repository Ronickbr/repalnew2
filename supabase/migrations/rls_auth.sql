-- RLS e funções de papel administrativo para Supabase Auth
-- Executar com service_role

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
select coalesce((current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role') in ('admin','super_admin'), false);
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
select coalesce((current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role') = 'super_admin', false);
$$;

-- Products
alter table if exists public.products enable row level security;
drop policy if exists products_select_all on public.products;
drop policy if exists products_write_admin on public.products;
drop policy if exists products_update_admin on public.products;
drop policy if exists products_delete_admin on public.products;

create policy products_select_all on public.products
for select using (true);

create policy products_write_admin on public.products
for insert with check (public.is_admin());

create policy products_update_admin on public.products
for update using (public.is_admin()) with check (public.is_admin());

create policy products_delete_admin on public.products
for delete using (public.is_admin());

-- Product images
alter table if exists public.product_images enable row level security;
drop policy if exists product_images_select_all on public.product_images;
drop policy if exists product_images_write_admin on public.product_images;
drop policy if exists product_images_update_admin on public.product_images;
drop policy if exists product_images_delete_admin on public.product_images;

create policy product_images_select_all on public.product_images
for select using (true);

create policy product_images_write_admin on public.product_images
for insert with check (public.is_admin());

create policy product_images_update_admin on public.product_images
for update using (public.is_admin()) with check (public.is_admin());

create policy product_images_delete_admin on public.product_images
for delete using (public.is_admin());

-- Site settings (integrações) - leitura pública, escrita somente admin
alter table if exists public.site_settings enable row level security;
drop policy if exists site_settings_select_all on public.site_settings;
drop policy if exists site_settings_write_admin on public.site_settings;
drop policy if exists site_settings_update_admin on public.site_settings;

create policy site_settings_select_all on public.site_settings
for select using (true);

create policy site_settings_write_admin on public.site_settings
for insert with check (public.is_admin());

create policy site_settings_update_admin on public.site_settings
for update using (public.is_admin()) with check (public.is_admin());

