-- Habilitar RLS e permitir acesso SEGURO para papel 'anon' na tabela de logs
-- Execute este script no SQL editor do Supabase (projeto alvo).
--
-- Visitantes anônimos podem registrar apenas ações públicas válidas e
-- consultar apenas agregações públicas (usadas no dashboard), nunca
-- os logs administrativos (login, admin_*, etc).

alter table if exists public.activity_logs enable row level security;

-- Política de INSERT restrito para visitantes anônimos
drop policy if exists "anon_can_insert_activity_logs" on public.activity_logs;
drop policy if exists "anon_insert_activity_logs" on public.activity_logs;
create policy "anon_insert_activity_logs"
  on public.activity_logs
  for insert
  to anon
  with check (
    action in ('product_view', 'site_visit', 'whatsapp_click')
    and resource_type in ('product', 'site', 'store')
    and coalesce(resource_id, '') <> ''
  );

-- Política de SELECT restrito para visitantes anônimos
-- (apenas as ações públicas de analytics, nunca logs de admin/auth)
drop policy if exists "anon_can_select_activity_logs" on public.activity_logs;
drop policy if exists "anon_select_activity_logs" on public.activity_logs;
create policy "anon_select_activity_logs"
  on public.activity_logs
  for select
  to anon
  using (
    action in ('product_view', 'site_visit', 'whatsapp_click')
  );

-- Observações:
-- - Logs administrativos e de autenticação ficam visíveis apenas para
--   o papel 'authenticated' (admin do painel).
