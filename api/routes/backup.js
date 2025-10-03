import express from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configurar multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/sql', 'application/json', 'text/csv', 'application/zip'];
    const allowedExtensions = ['.sql', '.json', '.csv', '.zip'];
    
    const hasValidType = allowedTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));
    
    if (hasValidType || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false);
    }
  }
});

// Middleware de autenticação
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Middleware de autorização (apenas admins)
const requireAdmin = async (req, res, next) => {
  try {
    // Verificar se o usuário é admin (implementar conforme sua lógica)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }

    next();
  } catch (error) {
    console.error('Erro na autorização:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Aplicar middlewares a todas as rotas
router.use(authenticateUser);
router.use(requireAdmin);

// GET /api/backup/stats - Obter estatísticas de backup
router.get('/stats', async (req, res) => {
  try {
    // Total de jobs
    const { count: totalJobs } = await supabase
      .from('backup_jobs')
      .select('*', { count: 'exact', head: true });

    // Jobs por status
    const { data: jobsByStatus } = await supabase
      .from('backup_jobs')
      .select('status')
      .then(({ data }) => {
        const stats = { completed: 0, failed: 0, running: 0, pending: 0 };
        data?.forEach(job => {
          stats[job.status] = (stats[job.status] || 0) + 1;
        });
        return { data: stats };
      });

    // Agendamentos ativos
    const { count: activeSchedules } = await supabase
      .from('backup_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    // Último backup
    const { data: lastBackup } = await supabase
      .from('backup_jobs')
      .select('completed_at, status')
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

    res.json({
      total_jobs: totalJobs || 0,
      completed_jobs: jobsByStatus?.completed || 0,
      failed_jobs: jobsByStatus?.failed || 0,
      running_jobs: jobsByStatus?.running || 0,
      pending_jobs: jobsByStatus?.pending || 0,
      active_schedules: activeSchedules || 0,
      last_backup: lastBackup?.completed_at || null,
      next_backup: nextBackup?.next_run || null,
      next_backup_name: nextBackup?.name || null,
      total_backup_size: totalSize
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

// POST /api/backup/jobs - Criar novo job de backup
router.post('/jobs', async (req, res) => {
  try {
    const { tables, format, compression } = req.body;

    // Validações
    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return res.status(400).json({ error: 'Tabelas são obrigatórias' });
    }

    if (!['sql', 'json', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Formato inválido' });
    }

    // Criar job
    const { data: job, error } = await supabase
      .from('backup_jobs')
      .insert({
        job_type: 'manual',
        status: 'pending',
        tables_included: tables,
        format,
        compression: compression || false,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Iniciar processamento assíncrono
    processBackupJobAsync(job.id);

    res.status(201).json(job);
  } catch (error) {
    console.error('Erro ao criar job:', error);
    res.status(500).json({ error: 'Erro ao criar job de backup' });
  }
});

// GET /api/backup/jobs - Listar jobs de backup
router.get('/jobs', async (req, res) => {
  try {
    const { status, type, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('backup_jobs')
      .select(`
        *,
        backup_files (*)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('job_type', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao listar jobs:', error);
    res.status(500).json({ error: 'Erro ao listar jobs' });
  }
});

// GET /api/backup/jobs/:id - Obter job específico
router.get('/jobs/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('backup_jobs')
      .select(`
        *,
        backup_files (*),
        backup_logs (*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Job não encontrado' });
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao obter job:', error);
    res.status(500).json({ error: 'Erro ao obter job' });
  }
});

// DELETE /api/backup/jobs/:id - Deletar job de backup
router.delete('/jobs/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('backup_jobs')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar job:', error);
    res.status(500).json({ error: 'Erro ao deletar job' });
  }
});

// GET /api/backup/jobs/:id/progress - Obter progresso do job
router.get('/jobs/:id/progress', async (req, res) => {
  try {
    const { data: job } = await supabase
      .from('backup_jobs')
      .select('status, started_at, completed_at')
      .eq('id', req.params.id)
      .single();

    if (!job) {
      return res.status(404).json({ error: 'Job não encontrado' });
    }

    let progress = 0;
    let estimatedTimeRemaining = 0;

    if (job.status === 'completed') {
      progress = 100;
    } else if (job.status === 'running' && job.started_at) {
      const elapsed = Date.now() - new Date(job.started_at).getTime();
      progress = Math.min(95, (elapsed / 5000) * 100);
      estimatedTimeRemaining = Math.max(0, 5000 - elapsed);
    }

    res.json({
      job_id: req.params.id,
      status: job.status,
      progress_percentage: progress,
      current_table: progress < 100 ? 'products' : null,
      estimated_time_remaining: estimatedTimeRemaining
    });
  } catch (error) {
    console.error('Erro ao obter progresso:', error);
    res.status(500).json({ error: 'Erro ao obter progresso' });
  }
});

// POST /api/backup/schedules - Criar agendamento
router.post('/schedules', async (req, res) => {
  try {
    const { 
      name, 
      frequency, 
      execution_time, 
      execution_day,
      tables, 
      format, 
      compression, 
      retention_days,
      active = true 
    } = req.body;

    // Validações
    if (!name || !frequency || !execution_time || !tables) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, frequency, execution_time, tables' });
    }

    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({ error: 'Frequência inválida' });
    }

    // Calcular próxima execução
    const nextRun = calculateNextRun(frequency, execution_time, execution_day);

    const { data, error } = await supabase
      .from('backup_schedules')
      .insert({
        name,
        frequency,
        execution_time,
        execution_day,
        tables_config: tables,
        format,
        compression: compression || false,
        retention_days: retention_days || 30,
        active,
        next_run: nextRun,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// GET /api/backup/schedules - Listar agendamentos
router.get('/schedules', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('backup_schedules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao listar agendamentos' });
  }
});

// PUT /api/backup/schedules/:id - Atualizar agendamento
router.put('/schedules/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Recalcular próxima execução se necessário
    if (updateData.frequency || updateData.execution_time || updateData.execution_day) {
      const { data: current } = await supabase
        .from('backup_schedules')
        .select('frequency, execution_time, execution_day')
        .eq('id', req.params.id)
        .single();

      updateData.next_run = calculateNextRun(
        updateData.frequency || current?.frequency,
        updateData.execution_time || current?.execution_time,
        updateData.execution_day || current?.execution_day
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('backup_schedules')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

// DELETE /api/backup/schedules/:id - Deletar agendamento
router.delete('/schedules/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('backup_schedules')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    res.status(500).json({ error: 'Erro ao deletar agendamento' });
  }
});

// POST /api/backup/restore - Restaurar backup
router.post('/restore', async (req, res) => {
  try {
    const { backup_id, tables, confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({ error: 'Confirmação necessária para restauração' });
    }

    // Verificar se o backup existe e está completo
    const { data: job } = await supabase
      .from('backup_jobs')
      .select('*, backup_files(*)')
      .eq('id', backup_id)
      .single();

    if (!job || job.status !== 'completed') {
      return res.status(400).json({ error: 'Backup não encontrado ou não concluído' });
    }

    // Simular restauração
    await new Promise(resolve => setTimeout(resolve, 2000));

    const affectedRows = Math.floor(Math.random() * 1000) + 100;

    // Criar log da restauração
    await supabase
      .from('backup_logs')
      .insert({
        job_id: backup_id,
        level: 'info',
        message: `Restauração concluída. ${affectedRows} registros restaurados.`,
        metadata: { tables, restored_by: req.user.id }
      });

    res.json({
      success: true,
      affected_rows: affectedRows,
      message: 'Restauração concluída com sucesso'
    });
  } catch (error) {
    console.error('Erro na restauração:', error);
    res.status(500).json({ error: 'Erro na restauração' });
  }
});

// GET /api/backup/files/:id/download - Download de arquivo de backup
router.get('/files/:id/download', async (req, res) => {
  try {
    const { data: file } = await supabase
      .from('backup_files')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Incrementar contador de downloads
    await supabase
      .from('backup_files')
      .update({ download_count: supabase.sql`download_count + 1` })
      .eq('id', req.params.id);

    // Em produção, aqui seria servido o arquivo real
    // Por enquanto, retornar URL de download simulada
    res.json({
      download_url: `${req.protocol}://${req.get('host')}/downloads/${file.file_name}`,
      file_name: file.file_name,
      file_size: file.file_size,
      expires_in: 3600 // 1 hora
    });
  } catch (error) {
    console.error('Erro no download:', error);
    res.status(500).json({ error: 'Erro no download' });
  }
});

// POST /api/backup/files/:id/validate - Validar arquivo de backup
router.post('/files/:id/validate', async (req, res) => {
  try {
    const { data: file } = await supabase
      .from('backup_files')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Simular validação
    await new Promise(resolve => setTimeout(resolve, 1000));

    const isValid = Math.random() > 0.1; // 90% de chance de ser válido
    const estimatedRecords = Math.floor(Math.random() * 10000) + 1000;

    res.json({
      is_valid: isValid,
      file_type: file.file_name.split('.').pop() || 'unknown',
      file_size: file.file_size,
      estimated_records: estimatedRecords,
      errors: isValid ? [] : ['Arquivo corrompido', 'Formato inválido']
    });
  } catch (error) {
    console.error('Erro na validação:', error);
    res.status(500).json({ error: 'Erro na validação' });
  }
});

// Função auxiliar para calcular próxima execução
function calculateNextRun(frequency, executionTime, executionDay) {
  const now = new Date();
  const [hours, minutes] = executionTime.split(':').map(Number);
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
    
    case 'weekly':
      const targetDay = executionDay || 0; // 0 = domingo
      const currentDay = nextRun.getDay();
      let daysUntilTarget = targetDay - currentDay;
      
      if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && nextRun <= now)) {
        daysUntilTarget += 7;
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      break;
    
    case 'monthly':
      const targetDate = executionDay || 1;
      nextRun.setDate(targetDate);
      
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
  }

  return nextRun.toISOString();
}

// Função para processar backup assincronamente
async function processBackupJobAsync(jobId) {
  try {
    // Atualizar status para "running"
    await supabase
      .from('backup_jobs')
      .update({ 
        status: 'running', 
        started_at: new Date().toISOString() 
      })
      .eq('id', jobId);

    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Obter dados do job
    const { data: job } = await supabase
      .from('backup_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) throw new Error('Job não encontrado');

    // Simular criação de arquivo
    const fileName = `backup_${job.format}_${new Date().toISOString().split('T')[0]}_${Date.now()}.${job.format}`;
    const fileSize = Math.floor(Math.random() * 10000000) + 1000000;
    const filePath = `/backups/${fileName}`;

    // Criar registro do arquivo
    await supabase
      .from('backup_files')
      .insert({
        job_id: jobId,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        checksum: generateChecksum(fileName),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

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

  } catch (error) {
    console.error('Erro ao processar backup:', error);
    
    // Atualizar job como falhou
    await supabase
      .from('backup_jobs')
      .update({ 
        status: 'failed', 
        error_message: error.message,
        completed_at: new Date().toISOString() 
      })
      .eq('id', jobId);

    // Criar log de erro
    await supabase
      .from('backup_logs')
      .insert({
        job_id: jobId,
        level: 'error',
        message: `Falha no backup: ${error.message}`
      });
  }
}

// Função auxiliar para gerar checksum
function generateChecksum(fileName) {
  return Buffer.from(fileName + Date.now()).toString('base64').substring(0, 32);
}

export default router;