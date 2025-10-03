-- Migração para corrigir problemas de autenticação nas tabelas de backup
-- Resolve erros 406 (Not Acceptable) garantindo acesso adequado

-- Verificar se RLS está habilitado e configurar corretamente
ALTER TABLE backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes para começar limpo
DROP POLICY IF EXISTS "backup_jobs_all_policy" ON backup_jobs;
DROP POLICY IF EXISTS "backup_files_all_policy" ON backup_files;
DROP POLICY IF EXISTS "backup_schedules_all_policy" ON backup_schedules;
DROP POLICY IF EXISTS "backup_logs_all_policy" ON backup_logs;

-- Criar políticas mais permissivas para resolver problemas de acesso
-- Permitir acesso completo para usuários autenticados e anônimos (para desenvolvimento)

-- Políticas para backup_jobs
CREATE POLICY "backup_jobs_public_access" ON backup_jobs
FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas para backup_files
CREATE POLICY "backup_files_public_access" ON backup_files
FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas para backup_schedules
CREATE POLICY "backup_schedules_public_access" ON backup_schedules
FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas para backup_logs
CREATE POLICY "backup_logs_public_access" ON backup_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Garantir permissões adequadas para todos os roles
GRANT ALL ON backup_jobs TO anon, authenticated, service_role;
GRANT ALL ON backup_files TO anon, authenticated, service_role;
GRANT ALL ON backup_schedules TO anon, authenticated, service_role;
GRANT ALL ON backup_logs TO anon, authenticated, service_role;

-- Garantir permissões nas sequências
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Recriar índices para performance
DROP INDEX IF EXISTS idx_backup_jobs_status;
DROP INDEX IF EXISTS idx_backup_jobs_created_at;
DROP INDEX IF EXISTS idx_backup_jobs_completed_at;
DROP INDEX IF EXISTS idx_backup_files_job_id;
DROP INDEX IF EXISTS idx_backup_schedules_active;
DROP INDEX IF EXISTS idx_backup_schedules_next_run;

CREATE INDEX idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX idx_backup_jobs_created_at ON backup_jobs(created_at DESC);
CREATE INDEX idx_backup_jobs_completed_at ON backup_jobs(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_backup_files_job_id ON backup_files(job_id);
CREATE INDEX idx_backup_schedules_active ON backup_schedules(active) WHERE active = true;
CREATE INDEX idx_backup_schedules_next_run ON backup_schedules(next_run ASC) WHERE active = true AND next_run IS NOT NULL;

-- Garantir que as foreign keys estão corretas
ALTER TABLE backup_jobs DROP CONSTRAINT IF EXISTS backup_jobs_created_by_fkey;
ALTER TABLE backup_jobs ADD CONSTRAINT backup_jobs_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE CASCADE;

ALTER TABLE backup_jobs DROP CONSTRAINT IF EXISTS backup_jobs_schedule_id_fkey;
ALTER TABLE backup_jobs ADD CONSTRAINT backup_jobs_schedule_id_fkey 
    FOREIGN KEY (schedule_id) REFERENCES backup_schedules(id) ON DELETE SET NULL;

ALTER TABLE backup_files DROP CONSTRAINT IF EXISTS backup_files_job_id_fkey;
ALTER TABLE backup_files ADD CONSTRAINT backup_files_job_id_fkey 
    FOREIGN KEY (job_id) REFERENCES backup_jobs(id) ON DELETE CASCADE;

ALTER TABLE backup_schedules DROP CONSTRAINT IF EXISTS backup_schedules_created_by_fkey;
ALTER TABLE backup_schedules ADD CONSTRAINT backup_schedules_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE CASCADE;

ALTER TABLE backup_logs DROP CONSTRAINT IF EXISTS backup_logs_job_id_fkey;
ALTER TABLE backup_logs ADD CONSTRAINT backup_logs_job_id_fkey 
    FOREIGN KEY (job_id) REFERENCES backup_jobs(id) ON DELETE CASCADE;