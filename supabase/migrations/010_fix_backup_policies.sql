-- Migração para corrigir políticas RLS das tabelas de backup
-- Corrige erros 406 (Not Acceptable) nas consultas

-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "backup_jobs_policy" ON backup_jobs;
DROP POLICY IF EXISTS "backup_files_policy" ON backup_files;
DROP POLICY IF EXISTS "backup_schedules_policy" ON backup_schedules;
DROP POLICY IF EXISTS "backup_logs_policy" ON backup_logs;

-- Remover políticas criadas anteriormente
DROP POLICY IF EXISTS "backup_jobs_select_policy" ON backup_jobs;
DROP POLICY IF EXISTS "backup_jobs_insert_policy" ON backup_jobs;
DROP POLICY IF EXISTS "backup_jobs_update_policy" ON backup_jobs;
DROP POLICY IF EXISTS "backup_jobs_delete_policy" ON backup_jobs;
DROP POLICY IF EXISTS "backup_files_select_policy" ON backup_files;
DROP POLICY IF EXISTS "backup_files_insert_policy" ON backup_files;
DROP POLICY IF EXISTS "backup_files_update_policy" ON backup_files;
DROP POLICY IF EXISTS "backup_files_delete_policy" ON backup_files;
DROP POLICY IF EXISTS "backup_schedules_select_policy" ON backup_schedules;
DROP POLICY IF EXISTS "backup_schedules_insert_policy" ON backup_schedules;
DROP POLICY IF EXISTS "backup_schedules_update_policy" ON backup_schedules;
DROP POLICY IF EXISTS "backup_schedules_delete_policy" ON backup_schedules;
DROP POLICY IF EXISTS "backup_logs_select_policy" ON backup_logs;
DROP POLICY IF EXISTS "backup_logs_insert_policy" ON backup_logs;

-- Criar políticas mais simples e permissivas para usuários autenticados
-- Políticas para backup_jobs
CREATE POLICY "backup_jobs_all_policy" ON backup_jobs
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para backup_files
CREATE POLICY "backup_files_all_policy" ON backup_files
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para backup_schedules
CREATE POLICY "backup_schedules_all_policy" ON backup_schedules
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para backup_logs
CREATE POLICY "backup_logs_all_policy" ON backup_logs
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Garantir que as tabelas têm as permissões corretas
GRANT ALL ON backup_jobs TO authenticated;
GRANT ALL ON backup_files TO authenticated;
GRANT ALL ON backup_schedules TO authenticated;
GRANT ALL ON backup_logs TO authenticated;

-- Garantir que as sequências têm as permissões corretas
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Recriar índices importantes se não existirem
CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_created_at ON backup_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_completed_at ON backup_jobs(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_backup_files_job_id ON backup_files(job_id);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_active ON backup_schedules(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_backup_schedules_next_run ON backup_schedules(next_run ASC) WHERE active = true AND next_run IS NOT NULL;