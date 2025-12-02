-- Habilitar RLS e permitir acesso para papel 'anon' na tabela de logs
-- Execute este script no SQL editor do Supabase (projeto alvo).

alter table if exists public.activity_logs enable row level security;

-- Política de INSERT para visitantes anônimos
drop policy if exists "anon_can_insert_activity_logs" on public.activity_logs;
create policy "anon_can_insert_activity_logs"
  on public.activity_logs
  for insert
  to anon
  with check (true);

-- Política de SELECT para visitantes anônimos (para agregação no dashboard)
drop policy if exists "anon_can_select_activity_logs" on public.activity_logs;
create policy "anon_can_select_activity_logs"
  on public.activity_logs
  for select
  to anon
  using (true);

-- Observações:
-- - Ajuste as políticas acima para regras mais restritivas conforme necessário
--   (por exemplo, limitar valores de 'action' ou validar 'resource_type').
-- - Certifique-se de que o papel 'anon' tenha permissão de uso no schema 'public'
--   (por padrão no Supabase já possui).
