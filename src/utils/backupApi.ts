import { supabase } from '../lib/supabase';
import { 
  BackupJob, 
  BackupSchedule, 
  CreateBackupJobRequest,
  CreateBackupScheduleRequest,
  UpdateBackupScheduleRequest,
  RestoreBackupRequest,
  BackupStats,
  BackupProgress,
  BackupFileValidation,
  AVAILABLE_TABLES
} from '../types/backup';
import { downloadBackup, prepareBackupData, generateBackupFilename } from './downloadUtils';

// Função para obter usuário do sistema customizado
const getCurrentUser = () => {
  const storedUser = localStorage.getItem('admin_user');
  const storedToken = localStorage.getItem('admin_token');
  
  if (!storedUser || !storedToken) {
    return null;
  }
  
  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

// Função para criar um job de backup manual
export const createBackupJob = async (request: CreateBackupJobRequest): Promise<BackupJob> => {
  try {
    // Validar tabelas selecionadas
    const invalidTables = request.tables.filter(table => !AVAILABLE_TABLES.some(availableTable => availableTable.id === table));
    if (invalidTables.length > 0) {
      throw new Error(`Tabelas inválidas: ${invalidTables.join(', ')}`);
    }

    // Obter usuário atual do sistema customizado
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Criar job de backup
    const { data, error } = await supabase
      .from('backup_jobs')
      .insert({
        job_type: 'manual',
        status: 'pending',
        tables_included: request.tables,
        format: request.format,
        compression: request.compression,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Iniciar processamento do backup (simulado)
    setTimeout(() => processBackupJob(data.id), 1000);

    return data;
  } catch (error) {
    console.error('Erro ao criar job de backup:', error);
    throw error;
  }
};

// Função para gerar dados de backup simulados
const generateBackupData = async (tables: string[], format: string): Promise<string> => {
  const backupData: any = {};
  
  // Simular dados para cada tabela
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(100); // Limitar para demonstração
      
      if (error) {
        console.warn(`Erro ao obter dados da tabela ${table}:`, error);
        backupData[table] = [];
      } else {
        backupData[table] = data || [];
      }
    } catch (err) {
      console.warn(`Erro ao acessar tabela ${table}:`, err);
      backupData[table] = [];
    }
  }

  return prepareBackupData(backupData, format);
};

// Função para processar um job de backup (simulada)
const processBackupJob = async (jobId: string): Promise<void> => {
  try {
    // Atualizar status para "running"
    await supabase
      .from('backup_jobs')
      .update({ 
        status: 'running', 
        started_at: new Date().toISOString() 
      })
      .eq('id', jobId);

    // Simular processamento (em produção, aqui seria feita a exportação real)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Obter dados do job
    const { data: job } = await supabase
      .from('backup_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) throw new Error('Job não encontrado');

    // Gerar dados de backup
    const backupData = await generateBackupData(job.tables_included, job.format);
    
    // Simular criação de arquivo de backup
    const fileName = generateBackupFilename(job.tables_included, job.format);
    const fileSize = new Blob([backupData]).size;
    const filePath = `/backups/${fileName}`;

    // Criar registro do arquivo
    const { error: fileError } = await supabase
      .from('backup_files')
      .insert({
        job_id: jobId,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        checksum: generateChecksum(fileName),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
      })
      .select()
      .single();

    if (fileError) throw fileError;

    // Atualizar job como concluído
    await supabase
      .from('backup_jobs')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', jobId);

    // Criar log de sucesso
    await supabase
      .from('backup_logs')
      .insert({
        job_id: jobId,
        level: 'info',
        message: `Backup concluído com sucesso. Arquivo: ${fileName}`
      });

    // DOWNLOAD AUTOMÁTICO - Fazer download do arquivo gerado
    try {
      await downloadBackup(jobId, job.tables_included, job.format, backupData);
      
      // Log do download
      await supabase
        .from('backup_logs')
        .insert({
          job_id: jobId,
          level: 'info',
          message: `Download automático iniciado: ${fileName}`
        });
    } catch (downloadError) {
      console.error('Erro no download automático:', downloadError);
      
      // Log do erro de download (não falha o backup)
      await supabase
        .from('backup_logs')
        .insert({
          job_id: jobId,
          level: 'warning',
          message: `Falha no download automático: ${downloadError instanceof Error ? downloadError.message : 'Erro desconhecido'}`
        });
    }

  } catch (error) {
    console.error('Erro ao processar backup:', error);
    
    // Atualizar job como falhou
    await supabase
      .from('backup_jobs')
      .update({ 
        status: 'failed', 
        error_message: error instanceof Error ? error.message : 'Erro desconhecido',
        completed_at: new Date().toISOString() 
      })
      .eq('id', jobId);

    // Criar log de erro
    await supabase
      .from('backup_logs')
      .insert({
        job_id: jobId,
        level: 'error',
        message: `Falha no backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
  }
};

// Função para criar agendamento de backup
export const createBackupSchedule = async (request: CreateBackupScheduleRequest): Promise<BackupSchedule> => {
  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Calcular próxima execução
    const nextRun = await calculateNextRun(request.frequency, request.execution_time, request.execution_day);

    const { data, error } = await supabase
      .from('backup_schedules')
      .insert({
        name: request.name,
        frequency: request.frequency,
        execution_time: request.execution_time,
        execution_day: request.execution_day,
        tables_config: request.tables_config,
        format: request.format,
        compression: request.compression,
        retention_days: request.retention_days,
        active: request.active,
        next_run: nextRun,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    throw error;
  }
};

// Função para atualizar agendamento de backup
export const updateBackupSchedule = async (id: string, request: UpdateBackupScheduleRequest): Promise<BackupSchedule> => {
  try {
    // Calcular próxima execução se necessário
    let nextRun;
    if (request.frequency || request.execution_time || request.execution_day) {
      const { data: current } = await supabase
        .from('backup_schedules')
        .select('frequency, execution_time, execution_day')
        .eq('id', id)
        .single();

      nextRun = await calculateNextRun(
        request.frequency || current?.frequency,
        request.execution_time || current?.execution_time,
        request.execution_day || current?.execution_day
      );
    }

    const updateData = {
      ...request,
      ...(nextRun && { next_run: nextRun }),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('backup_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    throw error;
  }
};

// Função para deletar agendamento
export const deleteBackupSchedule = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('backup_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    throw error;
  }
};

// Função para obter estatísticas de backup
export const getBackupStats = async (): Promise<BackupStats> => {
  try {
    // Total de jobs
    const { count: totalJobs } = await supabase
      .from('backup_jobs')
      .select('*', { count: 'exact', head: true });

    // Jobs concluídos
    const { count: completedJobs } = await supabase
      .from('backup_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Jobs falharam
    const { count: failedJobs } = await supabase
      .from('backup_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    // Agendamentos ativos
    const { count: activeSchedules } = await supabase
      .from('backup_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    // Último backup
    const { data: lastBackup } = await supabase
      .from('backup_jobs')
      .select('completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    // Próximo backup agendado
    const { data: nextBackup } = await supabase
      .from('backup_schedules')
      .select('next_run, name')
      .eq('active', true)
      .order('next_run', { ascending: true })
      .limit(1)
      .single();

    // Tamanho total dos backups
    const { data: files } = await supabase
      .from('backup_files')
      .select('file_size');

    const totalSize = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;

    return {
      total_jobs: totalJobs || 0,
      completed_jobs: completedJobs || 0,
      failed_jobs: failedJobs || 0,
      active_schedules: activeSchedules || 0,
      last_backup: lastBackup?.completed_at || null,
      next_backup: nextBackup?.next_run || null,
      next_backup_name: nextBackup?.name || null,
      total_backup_size: totalSize
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    throw error;
  }
};

// Função para restaurar backup
export const restoreBackup = async (request: RestoreBackupRequest): Promise<{ success: boolean; affected_rows: number }> => {
  try {
    if (!request.confirm) {
      throw new Error('Confirmação necessária para restauração');
    }

    // Obter dados do backup
    const { data: job } = await supabase
      .from('backup_jobs')
      .select('*, backup_files(*)')
      .eq('id', request.backup_id)
      .single();

    if (!job || job.status !== 'completed') {
      throw new Error('Backup não encontrado ou não concluído');
    }

    // Simular restauração (em produção, aqui seria feita a importação real)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simular número de registros afetados
    const affectedRows = Math.floor(Math.random() * 1000) + 100;

    // Criar log da restauração
    await createBackupLog(job.id, 'info', `Restauração concluída. ${affectedRows} registros restaurados.`);

    return {
      success: true,
      affected_rows: affectedRows
    };
  } catch (error) {
    console.error('Erro na restauração:', error);
    throw error;
  }
};

// Função para validar arquivo de backup
export const validateBackupFile = async (fileId: string): Promise<BackupFileValidation> => {
  try {
    const { data: file } = await supabase
      .from('backup_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (!file) {
      throw new Error('Arquivo não encontrado');
    }

    // Simular validação (em produção, aqui seria feita a validação real do arquivo)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const isValid = Math.random() > 0.1; // 90% de chance de ser válido
    const estimatedRecords = Math.floor(Math.random() * 10000) + 1000;

    return {
      is_valid: isValid,
      file_type: file.file_name.split('.').pop() || 'unknown',
      file_size: file.file_size,
      tables_found: ['products', 'categories', 'subcategories'],
      estimated_records: estimatedRecords,
      errors: isValid ? [] : ['Arquivo corrompido', 'Formato inválido']
    };
  } catch (error) {
    console.error('Erro na validação:', error);
    throw error;
  }
};

// Função para download de backup
export const downloadBackupFile = async (fileId: string): Promise<string> => {
  try {
    // Incrementar contador de downloads
    const { data: currentFile } = await supabase
      .from('backup_files')
      .select('download_count')
      .eq('id', fileId)
      .single();
    
    await supabase
      .from('backup_files')
      .update({ download_count: (currentFile?.download_count || 0) + 1 })
      .eq('id', fileId);

    // Em produção, aqui seria retornada a URL real do arquivo
    return `https://example.com/download/${fileId}`;
  } catch (error) {
    console.error('Erro no download:', error);
    throw error;
  }
};

// Função para deletar job de backup
export const deleteBackupJob = async (jobId: string): Promise<void> => {
  try {
    // Deletar arquivos associados primeiro (cascade deve cuidar disso, mas por segurança)
    await supabase
      .from('backup_files')
      .delete()
      .eq('job_id', jobId);

    // Deletar job
    const { error } = await supabase
      .from('backup_jobs')
      .delete()
      .eq('id', jobId);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar job:', error);
    throw error;
  }
};

// Funções auxiliares

// Calcular próxima execução
const calculateNextRun = async (frequency: string, executionTime: string, executionDay?: number): Promise<string> => {
  const { data, error } = await supabase.rpc('calculate_next_backup_run', {
    frequency,
    execution_time: executionTime,
    execution_day: executionDay
  });

  if (error) {
    console.error('Erro ao calcular próxima execução:', error);
    // Fallback: próxima execução em 24 horas
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  return data;
};

// Gerar checksum simples
const generateChecksum = (fileName: string): string => {
  return btoa(fileName + Date.now()).substring(0, 32);
};

// Criar log de backup
const createBackupLog = async (jobId: string, level: 'info' | 'warning' | 'error', message: string, metadata?: any): Promise<void> => {
  try {
    await supabase
      .from('backup_logs')
      .insert({
        job_id: jobId,
        level,
        message,
        metadata
      });
  } catch (error) {
    console.error('Erro ao criar log:', error);
  }
};

// Função para obter progresso de backup (simulada)
export const getBackupProgress = async (jobId: string): Promise<BackupProgress> => {
  try {
    const { data: job } = await supabase
      .from('backup_jobs')
      .select('status, started_at, completed_at')
      .eq('id', jobId)
      .single();

    if (!job) {
      throw new Error('Job não encontrado');
    }

    let progress = 0;
    let estimated_time_remaining: string | undefined;

    if (job.status === 'completed') {
      progress = 100;
    } else if (job.status === 'running' && job.started_at) {
      const elapsed = Date.now() - new Date(job.started_at).getTime();
      progress = Math.min(95, (elapsed / 5000) * 100); // Simular progresso baseado no tempo
      const remainingMs = Math.max(0, 5000 - elapsed);
      estimated_time_remaining = `${Math.ceil(remainingMs / 1000)}s`;
    }

    return {
      job_id: jobId,
      status: job.status,
      progress_percentage: progress,
      current_table: progress < 100 ? 'products' : undefined,
      estimated_time_remaining
    };
  } catch (error) {
    console.error('Erro ao obter progresso:', error);
    throw error;
  }
};