-- Criar sistema de backup do banco de dados
-- Migration: 007_create_backup_system.sql

-- Criar tabela de agendamentos primeiro (referenciada por backup_jobs)
CREATE TABLE backup_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    execution_time TIME NOT NULL,
    execution_day INTEGER, -- Para backups semanais/mensais
    tables_config JSONB NOT NULL,
    format VARCHAR(10) NOT NULL DEFAULT 'sql',
    compression BOOLEAN DEFAULT false,
    retention_days INTEGER DEFAULT 30,
    active BOOLEAN DEFAULT true,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de jobs de backup
CREATE TABLE backup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('manual', 'scheduled')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    tables_included JSONB NOT NULL,
    format VARCHAR(10) NOT NULL DEFAULT 'sql' CHECK (format IN ('sql', 'json', 'csv')),
    compression BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_by UUID NOT NULL REFERENCES admin_users(id),
    schedule_id UUID REFERENCES backup_schedules(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de arquivos de backup
CREATE TABLE backup_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES backup_jobs(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    checksum VARCHAR(64),
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de logs
CREATE TABLE backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES backup_jobs(id) ON DELETE CASCADE,
    level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warning', 'error')),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX idx_backup_jobs_created_by ON backup_jobs(created_by);
CREATE INDEX idx_backup_jobs_created_at ON backup_jobs(created_at DESC);
CREATE INDEX idx_backup_files_job_id ON backup_files(job_id);
CREATE INDEX idx_backup_schedules_active ON backup_schedules(active);
CREATE INDEX idx_backup_schedules_next_run ON backup_schedules(next_run) WHERE active = true;
CREATE INDEX idx_backup_logs_job_id ON backup_logs(job_id);
CREATE INDEX idx_backup_logs_created_at ON backup_logs(created_at DESC);

-- Configurar RLS (Row Level Security)
ALTER TABLE backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para administradores
CREATE POLICY "Admins can manage all backup jobs" ON backup_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all backup files" ON backup_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all backup schedules" ON backup_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all backup logs" ON backup_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Conceder permissões
GRANT ALL PRIVILEGES ON backup_jobs TO authenticated;
GRANT ALL PRIVILEGES ON backup_files TO authenticated;
GRANT ALL PRIVILEGES ON backup_schedules TO authenticated;
GRANT SELECT ON backup_logs TO authenticated;

-- Função para calcular próxima execução de backup (simplificada)
CREATE OR REPLACE FUNCTION calculate_next_backup_run(
    frequency VARCHAR(20),
    execution_time TIME,
    execution_day INTEGER DEFAULT NULL
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    next_run TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    CASE frequency
        WHEN 'daily' THEN
            next_run := CURRENT_DATE + execution_time;
            IF next_run <= current_time THEN
                next_run := next_run + INTERVAL '1 day';
            END IF;
        
        WHEN 'weekly' THEN
            next_run := CURRENT_DATE + execution_time + (COALESCE(execution_day, 0) || ' days')::INTERVAL;
            IF next_run <= current_time THEN
                next_run := next_run + INTERVAL '1 week';
            END IF;
        
        WHEN 'monthly' THEN
            next_run := CURRENT_DATE + execution_time + ((COALESCE(execution_day, 1) - 1) || ' days')::INTERVAL;
            IF next_run <= current_time THEN
                next_run := next_run + INTERVAL '1 month';
            END IF;
    END CASE;
    
    RETURN next_run;
END;
$$ LANGUAGE plpgsql;

-- Dados iniciais serão criados via interface administrativa

-- Comentários para documentação
COMMENT ON TABLE backup_jobs IS 'Tabela para armazenar jobs de backup executados';
COMMENT ON TABLE backup_files IS 'Tabela para armazenar metadados dos arquivos de backup gerados';
COMMENT ON TABLE backup_schedules IS 'Tabela para configurações de agendamento de backups automáticos';
COMMENT ON TABLE backup_logs IS 'Tabela para logs detalhados das operações de backup';
COMMENT ON FUNCTION calculate_next_backup_run IS 'Função para calcular a próxima execução de backup baseada na frequência';