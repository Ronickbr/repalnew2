import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BackupFile, 
  BackupLog,
  BackupStats,
  BackupHistoryFilters,
  CreateBackupJobRequest,
  CreateBackupScheduleRequest,
  UpdateBackupScheduleRequest,
  RestoreBackupRequest,
  BackupJobWithFiles,
  BackupScheduleWithStats
} from '../types/backup';
import { 
  validateBackupSecurity, 
  validateRestoreSecurity,
  SecurityValidationResult 
} from '../utils/backupSecurity';
import { useAuth } from './useAuth';
import { downloadBackup } from '../utils/downloadUtils';

// Hook para gerenciar jobs de backup
export const useBackupJobs = () => {
  const [jobs, setJobs] = useState<BackupJobWithFiles[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<SecurityValidationResult | null>(null);
  const { user } = useAuth();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Função para monitorar jobs em tempo real
  const startPolling = useCallback((jobId: string, onComplete?: (job: BackupJobWithFiles) => void) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('backup_jobs')
          .select(`
            *,
            backup_files (*)
          `)
          .eq('id', jobId)
          .single();

        if (error) throw error;

        if (data && (data.status === 'completed' || data.status === 'failed')) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          
          // Atualizar lista de jobs
          await fetchJobs();
          
          // Chamar callback se fornecido
          if (onComplete) {
            onComplete(data);
          }
        }
      } catch (err) {
        console.error('Erro no polling:', err);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }, 2000); // Verificar a cada 2 segundos

    // Limpar após 5 minutos para evitar polling infinito
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 300000);
  }, []);

  // Limpar polling quando componente for desmontado
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const fetchJobs = useCallback(async (filters?: BackupHistoryFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('backup_jobs')
        .select(`
          *,
          backup_files (*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.job_type) {
        query = query.eq('job_type', filters.job_type);
      }
      
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.page && filters?.limit) {
        const offset = (filters.page - 1) * filters.limit;
        query = query.range(offset, offset + filters.limit - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar jobs de backup');
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(async (request: CreateBackupJobRequest) => {
    setLoading(true);
    setError(null);
    setValidationResult(null);

    try {
      // Usar sistema de autenticação customizado
      if (!user) throw new Error('Usuário não autenticado');

      // Validar segurança antes de criar o job
      const validation = await validateBackupSecurity(
        user.id,
        request.tables,
        request.format
      );

      setValidationResult(validation);

      if (!validation.isValid) {
        throw new Error(`Validação de segurança falhou: ${validation.errors.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('backup_jobs')
        .insert({
          job_type: 'manual',
          status: 'pending',
          tables_included: request.tables,
          format: request.format,
          compression: request.compression || false,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar lista de jobs
      await fetchJobs();
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar job de backup';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchJobs, user]);

  const deleteJob = useCallback(async (jobId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Primeiro, deletar todos os arquivos associados ao job
      const { error: filesError } = await supabase
        .from('backup_files')
        .delete()
        .eq('job_id', jobId);

      if (filesError) {
        console.warn('Erro ao deletar arquivos de backup:', filesError);
        // Continuar mesmo se houver erro nos arquivos
      }

      // Deletar logs associados
      const { error: logsError } = await supabase
        .from('backup_logs')
        .delete()
        .eq('job_id', jobId);

      if (logsError) {
        console.warn('Erro ao deletar logs de backup:', logsError);
        // Continuar mesmo se houver erro nos logs
      }

      // Finalmente, deletar o job
      const { error: jobError } = await supabase
        .from('backup_jobs')
        .delete()
        .eq('id', jobId);

      if (jobError) throw jobError;
      
      // Atualizar lista de jobs
      await fetchJobs();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar job de backup';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    validationResult,
    fetchJobs,
    createJob,
    deleteJob,
    startPolling
  };
};

// Hook para gerenciar agendamentos de backup
export const useBackupSchedules = () => {
  const [schedules, setSchedules] = useState<BackupScheduleWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('backup_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar agendamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSchedule = useCallback(async (request: CreateBackupScheduleRequest) => {
    setLoading(true);
    setError(null);

    try {
      // Usar sistema de autenticação customizado
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('backup_schedules')
        .insert({
          ...request,
          created_by: user.id,
          active: request.active ?? true,
          retention_days: request.retention_days ?? 30,
          format: request.format ?? 'sql',
          compression: request.compression ?? false
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchSchedules();
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  }, [fetchSchedules, user]);

  const updateSchedule = useCallback(async (request: UpdateBackupScheduleRequest) => {
    setLoading(true);
    setError(null);

    try {
      const { id, ...updateData } = request;
      const { data, error } = await supabase
        .from('backup_schedules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchSchedules();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar agendamento';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchSchedules]);

  const deleteSchedule = useCallback(async (scheduleId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('backup_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
      
      await fetchSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar agendamento');
    } finally {
      setLoading(false);
    }
  }, [fetchSchedules]);

  const toggleSchedule = useCallback(async (scheduleId: string, active: boolean) => {
    return updateSchedule({ id: scheduleId, active });
  }, [updateSchedule]);

  return {
    schedules,
    loading,
    error,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule
  };
};

// Hook para gerenciar arquivos de backup
export const useBackupFiles = () => {
  const [files, setFiles] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async (jobId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('backup_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar arquivos de backup');
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadFile = useCallback(async (fileId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Buscar informações do arquivo primeiro
      const { data: file, error: fileError } = await supabase
        .from('backup_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError) throw fileError;

      // Incrementar contador de download
      const { error: updateError } = await supabase
        .from('backup_files')
        .update({ download_count: (file?.download_count || 0) + 1 })
        .eq('id', fileId);

      if (updateError) throw updateError;

      // Simular download (em produção, seria um endpoint real)
      const downloadUrl = `/api/backup/download/${fileId}`;
      window.open(downloadUrl, '_blank');
      
      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer download do arquivo');
    } finally {
      setLoading(false);
    }
  }, [fetchFiles]);

  const deleteFile = useCallback(async (fileId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('backup_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      
      // Atualizar lista de arquivos
      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar arquivo');
    } finally {
      setLoading(false);
    }
  }, [fetchFiles]);

  // Função para download automático de backup
  const autoDownloadBackup = useCallback(async (job: BackupJobWithFiles) => {
    try {
      if (job.status !== 'completed' || !job.files || job.files.length === 0) {
        throw new Error('Backup não está completo ou não possui arquivos');
      }

      // Pegar o primeiro arquivo (principal)
      const mainFile = job.files[0];
      
      // Simular dados do backup para download
      const backupData = `-- Backup gerado em ${new Date().toISOString()}
-- Job ID: ${job.id}
-- Tabelas: ${job.tables_included.join(', ')}
-- Formato: ${job.format}

-- Este é um arquivo de backup simulado
-- Em produção, aqui estariam os dados reais do backup
`;

      // Fazer download
      await downloadBackup(job.id, job.tables_included, job.format, backupData);
      
      // Incrementar contador de download
      await supabase
        .from('backup_files')
        .update({ download_count: (mainFile.download_count || 0) + 1 })
        .eq('id', mainFile.id);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no download automático');
      throw err;
    }
  }, []);

  return {
    files,
    loading,
    error,
    fetchFiles,
    downloadFile,
    deleteFile,
    autoDownloadBackup
  };
};

// Hook para restauração de backup
export const useBackupRestore = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<SecurityValidationResult | null>(null);
  const { user } = useAuth();

  const restoreBackup = useCallback(async (request: RestoreBackupRequest) => {
    setLoading(true);
    setError(null);
    setValidationResult(null);

    try {
      if (!request.confirm) {
        throw new Error('Confirmação necessária para restaurar backup');
      }

      // Usar sistema de autenticação customizado
      if (!user) throw new Error('Usuário não autenticado');

      // Validar segurança da restauração
      const validation = await validateRestoreSecurity(
        request.backup_id,
        user.id,
        request.tables || []
      );

      setValidationResult(validation);

      if (!validation.isValid) {
        throw new Error(`Validação de segurança falhou: ${validation.errors.join(', ')}`);
      }

      // Buscar informações do backup
      const { data: job, error: jobError } = await supabase
        .from('backup_jobs')
        .select(`
          *,
          backup_files (*)
        `)
        .eq('id', request.backup_id)
        .single();

      if (jobError) throw jobError;
      if (!job) throw new Error('Backup não encontrado');

      // Simular processo de restauração (em produção seria um endpoint real)
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Erro na restauração do backup');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao restaurar backup';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const validateBackupFile = useCallback(async (fileId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/backup/validate/${fileId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Erro na validação do arquivo');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao validar arquivo';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    validationResult,
    restoreBackup,
    validateBackupFile
  };
};

// Hook para estatísticas do dashboard
export const useBackupStats = () => {
  const [stats, setStats] = useState<BackupStats>({
    total_jobs: 0,
    completed_jobs: 0,
    failed_jobs: 0,
    active_schedules: 0,
    last_backup: null,
    next_backup: null,
    next_backup_name: null,
    total_backup_size: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar estatísticas dos jobs com dados completos
      const { data: jobs, error: jobsError } = await supabase
        .from('backup_jobs')
        .select(`
          *,
          backup_files (*)
        `)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Buscar tamanho total dos arquivos
      const { data: files, error: filesError } = await supabase
        .from('backup_files')
        .select('file_size');

      if (filesError) throw filesError;

      // Buscar agendamentos ativos
      const { data: schedules, error: schedulesError } = await supabase
        .from('backup_schedules')
        .select('*')
        .eq('active', true)
        .order('next_run', { ascending: true });

      if (schedulesError) throw schedulesError;

      // Calcular estatísticas
      const total_backups = jobs?.length || 0;
      const successful_backups = jobs?.filter(job => job.status === 'completed').length || 0;
      const failed_backups = jobs?.filter(job => job.status === 'failed').length || 0;
      const total_storage_used = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;
      const active_schedules = schedules?.length || 0;
      
      // Último backup com dados completos
      const last_backup = jobs && jobs.length > 0 ? jobs[0] : undefined;
      
      // Próximo agendamento
      const next_scheduled = schedules && schedules.length > 0 ? schedules[0] : undefined;

      setStats({
        total_jobs: total_backups,
        completed_jobs: successful_backups,
        failed_jobs: failed_backups,
        active_schedules,
        last_backup: last_backup?.completed_at || null,
        next_backup: next_scheduled?.next_run || null,
        next_backup_name: next_scheduled?.name || null,
        total_backup_size: total_storage_used
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas');
      
      // Definir valores padrão em caso de erro para evitar NaN
      setStats({
        total_jobs: 0,
        completed_jobs: 0,
        failed_jobs: 0,
        active_schedules: 0,
        last_backup: null,
        next_backup: null,
        next_backup_name: null,
        total_backup_size: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
};

// Hook para logs de backup
export const useBackupLogs = () => {
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (jobId?: string, level?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('backup_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      if (level) {
        query = query.eq('level', level);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar logs');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logs,
    loading,
    error,
    fetchLogs
  };
};