-- Migração para corrigir problemas de relacionamento nas tabelas de backup
-- Corrige erros 406 (Not Acceptable) nas consultas

-- Primeiro, vamos garantir que as foreign keys estão corretas
-- e que não há problemas de relacionamento

-- Verificar e recriar índices se necessário
DROP INDEX IF EXISTS idx_backup_jobs_status;
DROP INDEX IF EXISTS idx_backup_jobs_created_at;
DROP INDEX IF EXISTS idx_backup_jobs_schedule_id;
DROP INDEX IF EXISTS idx_backup_files_job_id;
DROP INDEX IF EXISTS idx_backup_schedules_active;
DROP INDEX IF EXISTS idx_backup_schedules_next_run;

-- Recriar índices otimizados
CREATE INDEX idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX idx_backup_jobs_created_at ON backup_jobs(created_at DESC);
CREATE INDEX idx_backup_jobs_completed_at ON backup_jobs(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_backup_jobs_schedule_id ON backup_jobs(schedule_id) WHERE schedule_id IS NOT NULL;
CREATE INDEX idx_backup_files_job_id ON backup_files(job_id);
CREATE INDEX idx_backup_schedules_active ON backup_schedules(active) WHERE active = true;
CREATE INDEX idx_backup_schedules_next_run ON backup_schedules(next_run ASC) WHERE active = true AND next_run IS NOT NULL;

-- Garantir que as foreign keys estão corretas
-- Remover e recriar as constraints se necessário
ALTER TABLE backup_jobs DROP CONSTRAINT IF EXISTS backup_jobs_created_by_fkey;
ALTER TABLE backup_jobs DROP CONSTRAINT IF EXISTS backup_jobs_schedule_id_fkey;
ALTER TABLE backup_files DROP CONSTRAINT IF EXISTS backup_files_job_id_fkey;
ALTER TABLE backup_schedules DROP CONSTRAINT IF EXISTS backup_schedules_created_by_fkey;
ALTER TABLE backup_logs DROP CONSTRAINT IF EXISTS backup_logs_job_id_fkey;

-- Recriar as foreign keys
ALTER TABLE backup_jobs 
ADD CONSTRAINT backup_jobs_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE CASCADE;

ALTER TABLE backup_jobs 
ADD CONSTRAINT backup_jobs_schedule_id_fkey 
FOREIGN KEY (schedule_id) REFERENCES backup_schedules(id) ON DELETE SET NULL;

ALTER TABLE backup_files 
ADD CONSTRAINT backup_files_job_id_fkey 
FOREIGN KEY (job_id) REFERENCES backup_jobs(id) ON DELETE CASCADE;

ALTER TABLE backup_schedules 
ADD CONSTRAINT backup_schedules_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE CASCADE;

ALTER TABLE backup_logs 
ADD CONSTRAINT backup_logs_job_id_fkey 
FOREIGN KEY (job_id) REFERENCES backup_jobs(id) ON DELETE CASCADE;

-- Atualizar as políticas RLS para garantir que as consultas funcionem corretamente
-- Remover políticas existentes
DROP POLICY IF EXISTS "backup_jobs_policy" ON backup_jobs;
DROP POLICY IF EXISTS "backup_files_policy" ON backup_files;
DROP POLICY IF EXISTS "backup_schedules_policy" ON backup_schedules;
DROP POLICY IF EXISTS "backup_logs_policy" ON backup_logs;

-- Criar políticas mais permissivas para usuários autenticados
CREATE POLICY "backup_jobs_select_policy" ON backup_jobs
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "backup_jobs_insert_policy" ON backup_jobs
FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "backup_jobs_update_policy" ON backup_jobs
FOR UPDATE TO authenticated
USING (auth.uid()::text = created_by);

CREATE POLICY "backup_jobs_delete_policy" ON backup_jobs
FOR DELETE TO authenticated
USING (auth.uid()::text = created_by);

-- Políticas para backup_files
CREATE POLICY "backup_files_select_policy" ON backup_files
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "backup_files_insert_policy" ON backup_files
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "backup_files_update_policy" ON backup_files
FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "backup_files_delete_policy" ON backup_files
FOR DELETE TO authenticated
USING (true);

-- Políticas para backup_schedules
CREATE POLICY "backup_schedules_select_policy" ON backup_schedules
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "backup_schedules_insert_policy" ON backup_schedules
FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "backup_schedules_update_policy" ON backup_schedules
FOR UPDATE TO authenticated
USING (auth.uid()::text = created_by);

CREATE POLICY "backup_schedules_delete_policy" ON backup_schedules
FOR DELETE TO authenticated
USING (auth.uid()::text = created_by);

-- Políticas para backup_logs
CREATE POLICY "backup_logs_select_policy" ON backup_logs
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "backup_logs_insert_policy" ON backup_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- Garantir que as tabelas têm as permissões corretas
GRANT ALL ON backup_jobs TO authenticated;
GRANT ALL ON backup_files TO authenticated;
GRANT ALL ON backup_schedules TO authenticated;
GRANT ALL ON backup_logs TO authenticated;

-- Garantir que as sequências têm as permissões corretas (se existirem)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comentários para documentação
COMMENT ON INDEX idx_backup_jobs_status IS 'Índice para consultas por status de backup jobs';
COMMENT ON INDEX idx_backup_jobs_created_at IS 'Índice para ordenação por data de criação';
COMMENT ON INDEX idx_backup_jobs_completed_at IS 'Índice para consultas de backups concluídos';
COMMENT ON INDEX idx_backup_files_job_id IS 'Índice para relacionamento com backup jobs';
COMMENT ON INDEX idx_backup_schedules_active IS 'Índice para agendamentos ativos';
COMMENT ON INDEX idx_backup_schedules_next_run IS 'Índice para próximos agendamentos';