-- Políticas permissivas para o papel 'anon' em todas as tabelas principais
-- Execute este script no SQL editor do seu projeto Supabase.

-- helper: habilitar RLS em todas as tabelas listadas
alter table if exists public.banners enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.products enable row level security;
alter table if exists public.product_images enable row level security;
alter table if exists public.brands enable row level security;
alter table if exists public.promotions enable row level security;
alter table if exists public.promotion_products enable row level security;
alter table if exists public.leads enable row level security;
alter table if exists public.stores enable row level security;
alter table if exists public.users enable row level security;
alter table if exists public.admin_users enable row level security;
alter table if exists public.profiles enable row level security;
alter table if exists public.site_settings enable row level security;
alter table if exists public.activity_logs enable row level security;

-- SELECT para anon
drop policy if exists "anon_select_banners" on public.banners;
create policy "anon_select_banners" on public.banners for select to anon using (true);
drop policy if exists "anon_select_categories" on public.categories;
create policy "anon_select_categories" on public.categories for select to anon using (true);
drop policy if exists "anon_select_products" on public.products;
create policy "anon_select_products" on public.products for select to anon using (true);
drop policy if exists "anon_select_product_images" on public.product_images;
create policy "anon_select_product_images" on public.product_images for select to anon using (true);
drop policy if exists "anon_select_brands" on public.brands;
create policy "anon_select_brands" on public.brands for select to anon using (true);
drop policy if exists "anon_select_promotions" on public.promotions;
create policy "anon_select_promotions" on public.promotions for select to anon using (true);
drop policy if exists "anon_select_promotion_products" on public.promotion_products;
create policy "anon_select_promotion_products" on public.promotion_products for select to anon using (true);
drop policy if exists "anon_select_leads" on public.leads;
create policy "anon_select_leads" on public.leads for select to anon using (true);
drop policy if exists "anon_select_stores" on public.stores;
create policy "anon_select_stores" on public.stores for select to anon using (true);
drop policy if exists "anon_select_users" on public.users;
create policy "anon_select_users" on public.users for select to anon using (true);
drop policy if exists "anon_select_admin_users" on public.admin_users;
create policy "anon_select_admin_users" on public.admin_users for select to anon using (true);
drop policy if exists "anon_select_profiles" on public.profiles;
create policy "anon_select_profiles" on public.profiles for select to anon using (true);
drop policy if exists "anon_select_site_settings" on public.site_settings;
create policy "anon_select_site_settings" on public.site_settings for select to anon using (true);
drop policy if exists "anon_select_activity_logs" on public.activity_logs;
create policy "anon_select_activity_logs" on public.activity_logs for select to anon using (true);

-- INSERT para anon
drop policy if exists "anon_insert_banners" on public.banners;
create policy "anon_insert_banners" on public.banners for insert to anon with check (true);
drop policy if exists "anon_insert_categories" on public.categories;
create policy "anon_insert_categories" on public.categories for insert to anon with check (true);
drop policy if exists "anon_insert_products" on public.products;
create policy "anon_insert_products" on public.products for insert to anon with check (true);
drop policy if exists "anon_insert_product_images" on public.product_images;
create policy "anon_insert_product_images" on public.product_images for insert to anon with check (true);
drop policy if exists "anon_insert_brands" on public.brands;
create policy "anon_insert_brands" on public.brands for insert to anon with check (true);
drop policy if exists "anon_insert_promotions" on public.promotions;
create policy "anon_insert_promotions" on public.promotions for insert to anon with check (true);
drop policy if exists "anon_insert_promotion_products" on public.promotion_products;
create policy "anon_insert_promotion_products" on public.promotion_products for insert to anon with check (true);
drop policy if exists "anon_insert_leads" on public.leads;
create policy "anon_insert_leads" on public.leads for insert to anon with check (true);
drop policy if exists "anon_insert_stores" on public.stores;
create policy "anon_insert_stores" on public.stores for insert to anon with check (true);
drop policy if exists "anon_insert_users" on public.users;
create policy "anon_insert_users" on public.users for insert to anon with check (true);
drop policy if exists "anon_insert_admin_users" on public.admin_users;
create policy "anon_insert_admin_users" on public.admin_users for insert to anon with check (true);
drop policy if exists "anon_insert_profiles" on public.profiles;
create policy "anon_insert_profiles" on public.profiles for insert to anon with check (true);
drop policy if exists "anon_insert_site_settings" on public.site_settings;
create policy "anon_insert_site_settings" on public.site_settings for insert to anon with check (true);
drop policy if exists "anon_insert_activity_logs" on public.activity_logs;
create policy "anon_insert_activity_logs" on public.activity_logs for insert to anon with check (true);

-- UPDATE para anon
drop policy if exists "anon_update_banners" on public.banners;
create policy "anon_update_banners" on public.banners for update to anon using (true) with check (true);
drop policy if exists "anon_update_categories" on public.categories;
create policy "anon_update_categories" on public.categories for update to anon using (true) with check (true);
drop policy if exists "anon_update_products" on public.products;
create policy "anon_update_products" on public.products for update to anon using (true) with check (true);
drop policy if exists "anon_update_product_images" on public.product_images;
create policy "anon_update_product_images" on public.product_images for update to anon using (true) with check (true);
drop policy if exists "anon_update_brands" on public.brands;
create policy "anon_update_brands" on public.brands for update to anon using (true) with check (true);
drop policy if exists "anon_update_promotions" on public.promotions;
create policy "anon_update_promotions" on public.promotions for update to anon using (true) with check (true);
drop policy if exists "anon_update_promotion_products" on public.promotion_products;
create policy "anon_update_promotion_products" on public.promotion_products for update to anon using (true) with check (true);
drop policy if exists "anon_update_leads" on public.leads;
create policy "anon_update_leads" on public.leads for update to anon using (true) with check (true);
drop policy if exists "anon_update_stores" on public.stores;
create policy "anon_update_stores" on public.stores for update to anon using (true) with check (true);
drop policy if exists "anon_update_users" on public.users;
create policy "anon_update_users" on public.users for update to anon using (true) with check (true);
drop policy if exists "anon_update_admin_users" on public.admin_users;
create policy "anon_update_admin_users" on public.admin_users for update to anon using (true) with check (true);
drop policy if exists "anon_update_profiles" on public.profiles;
create policy "anon_update_profiles" on public.profiles for update to anon using (true) with check (true);
drop policy if exists "anon_update_site_settings" on public.site_settings;
create policy "anon_update_site_settings" on public.site_settings for update to anon using (true) with check (true);
drop policy if exists "anon_update_activity_logs" on public.activity_logs;
create policy "anon_update_activity_logs" on public.activity_logs for update to anon using (true) with check (true);

-- DELETE para anon
drop policy if exists "anon_delete_banners" on public.banners;
create policy "anon_delete_banners" on public.banners for delete to anon using (true);
drop policy if exists "anon_delete_categories" on public.categories;
create policy "anon_delete_categories" on public.categories for delete to anon using (true);
drop policy if exists "anon_delete_products" on public.products;
create policy "anon_delete_products" on public.products for delete to anon using (true);
drop policy if exists "anon_delete_product_images" on public.product_images;
create policy "anon_delete_product_images" on public.product_images for delete to anon using (true);
drop policy if exists "anon_delete_brands" on public.brands;
create policy "anon_delete_brands" on public.brands for delete to anon using (true);
drop policy if exists "anon_delete_promotions" on public.promotions;
create policy "anon_delete_promotions" on public.promotions for delete to anon using (true);
drop policy if exists "anon_delete_promotion_products" on public.promotion_products;
create policy "anon_delete_promotion_products" on public.promotion_products for delete to anon using (true);
drop policy if exists "anon_delete_leads" on public.leads;
create policy "anon_delete_leads" on public.leads for delete to anon using (true);
drop policy if exists "anon_delete_stores" on public.stores;
create policy "anon_delete_stores" on public.stores for delete to anon using (true);
drop policy if exists "anon_delete_users" on public.users;
create policy "anon_delete_users" on public.users for delete to anon using (true);
drop policy if exists "anon_delete_admin_users" on public.admin_users;
create policy "anon_delete_admin_users" on public.admin_users for delete to anon using (true);
drop policy if exists "anon_delete_profiles" on public.profiles;
create policy "anon_delete_profiles" on public.profiles for delete to anon using (true);
drop policy if exists "anon_delete_site_settings" on public.site_settings;
create policy "anon_delete_site_settings" on public.site_settings for delete to anon using (true);
drop policy if exists "anon_delete_activity_logs" on public.activity_logs;
create policy "anon_delete_activity_logs" on public.activity_logs for delete to anon using (true);

-- Atenção: estas políticas são extremamente permissivas e devem ser restritas em produção.
