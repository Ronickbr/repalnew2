-- Corrigir políticas RLS para tabelas de backup
-- Migration: 008_fix_backup_rls_policies.sql

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can manage all backup jobs" ON backup_jobs;
DROP POLICY IF EXISTS "Admins can manage all backup files" ON backup_files;
DROP POLICY IF EXISTS "Admins can manage all backup schedules" ON backup_schedules;
DROP POLICY IF EXISTS "Admins can view all backup logs" ON backup_logs;

-- Criar políticas RLS mais permissivas para usuários autenticados
-- Política para backup_schedules
CREATE POLICY "Authenticated users can manage backup schedules" ON backup_schedules
    FOR ALL USING (
        auth.role() = 'authenticated'
    );

-- Política para backup_jobs
CREATE POLICY "Authenticated users can manage backup jobs" ON backup_jobs
    FOR ALL USING (
        auth.role() = 'authenticated'
    );

-- Política para backup_files
CREATE POLICY "Authenticated users can manage backup files" ON backup_files
    FOR ALL USING (
        auth.role() = 'authenticated'
    );

-- Política para backup_logs
CREATE POLICY "Authenticated users can view backup logs" ON backup_logs
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- Garantir que as permissões estão corretas
GRANT ALL PRIVILEGES ON backup_schedules TO authenticated;
GRANT ALL PRIVILEGES ON backup_jobs TO authenticated;
GRANT ALL PRIVILEGES ON backup_files TO authenticated;
GRANT SELECT ON backup_logs TO authenticated;

-- Comentários para documentação
COMMENT ON POLICY "Authenticated users can manage backup schedules" ON backup_schedules IS 'Permite que usuários autenticados gerenciem agendamentos de backup';
COMMENT ON POLICY "Authenticated users can manage backup jobs" ON backup_jobs IS 'Permite que usuários autenticados gerenciem jobs de backup';
COMMENT ON POLICY "Authenticated users can manage backup files" ON backup_files IS 'Permite que usuários autenticados gerenciem arquivos de backup';
COMMENT ON POLICY "Authenticated users can view backup logs" ON backup_logs IS 'Permite que usuários autenticados visualizem logs de backup';