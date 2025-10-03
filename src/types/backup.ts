// Tipos TypeScript para o sistema de backup

export interface BackupJob {
  id: string;
  job_type: 'manual' | 'scheduled';
  status: 'pending' | 'running' | 'completed' | 'failed';
  tables_included: string[];
  format: 'sql' | 'json' | 'csv';
  compression: boolean;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_by: string;
  schedule_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BackupFile {
  id: string;
  job_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  checksum?: string;
  download_count: number;
  created_at: string;
  expires_at?: string;
}

export interface BackupSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  execution_time: string;
  execution_day?: number;
  tables_config: string[];
  format: 'sql' | 'json' | 'csv';
  compression: boolean;
  retention_days: number;
  active: boolean;
  last_run?: string;
  next_run?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BackupLog {
  id: string;
  job_id?: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Tipos para formulários e requests
export interface CreateBackupJobRequest {
  tables: string[];
  format: 'sql' | 'json' | 'csv';
  compression?: boolean;
}

export interface CreateBackupScheduleRequest {
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  execution_time: string;
  execution_day?: number;
  tables_config: string[];
  format?: 'sql' | 'json' | 'csv';
  compression?: boolean;
  retention_days?: number;
  active?: boolean;
}

export interface UpdateBackupScheduleRequest extends Partial<CreateBackupScheduleRequest> {
  id: string;
}

export interface RestoreBackupRequest {
  backup_id: string;
  tables?: string[];
  confirm: boolean;
}

// Tipos para responses da API
export interface BackupJobResponse {
  success: boolean;
  backup_id: string;
  download_url?: string;
  file_size?: number;
  message?: string;
}

export interface BackupScheduleResponse {
  success: boolean;
  schedule_id: string;
  next_execution?: string;
  message?: string;
}

export interface BackupHistoryResponse {
  backups: (BackupJob & { files?: BackupFile[] })[];
  total: number;
  page: number;
  total_pages: number;
}

export interface RestoreBackupResponse {
  success: boolean;
  restored_tables: string[];
  affected_rows: number;
  message?: string;
}

// Tipos para filtros e paginação
export interface BackupHistoryFilters {
  page?: number;
  limit?: number;
  date_from?: string;
  date_to?: string;
  status?: BackupJob['status'];
  job_type?: BackupJob['job_type'];
}

// Tipos para estatísticas do dashboard
export interface BackupStats {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  active_schedules: number;
  last_backup?: string | null;
  next_backup?: string | null;
  next_backup_name?: string | null;
  total_backup_size: number;
}

// Tipos para tabelas disponíveis para backup
export interface AvailableTable {
  id: string;
  name: string;
  description: string;
  estimated_size?: number;
  row_count?: number;
}

// Tipos para progresso de backup
export interface BackupProgress {
  job_id: string;
  status: BackupJob['status'];
  progress_percentage: number;
  current_table?: string;
  estimated_completion?: string;
  estimated_time_remaining?: string;
  message?: string;
}

// Tipos para validação de arquivos de backup
export interface BackupFileValidation {
  is_valid: boolean;
  file_type: string;
  tables_found: string[];
  estimated_records: number;
  file_size: number;
  errors?: string[];
  warnings?: string[];
}

// Constantes para o sistema de backup
export const BACKUP_FORMATS = ['sql', 'json', 'csv'] as const;
export const BACKUP_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;
export const BACKUP_STATUSES = ['pending', 'running', 'completed', 'failed'] as const;
export const BACKUP_JOB_TYPES = ['manual', 'scheduled'] as const;
export const LOG_LEVELS = ['info', 'warning', 'error'] as const;

// Tabelas disponíveis para backup
export const AVAILABLE_TABLES: AvailableTable[] = [
  {
    id: 'products',
    name: 'Produtos',
    description: 'Catálogo completo de produtos'
  },
  {
    id: 'categories',
    name: 'Categorias',
    description: 'Categorias principais'
  },
  {
    id: 'subcategories',
    name: 'Subcategorias',
    description: 'Subcategorias dos produtos'
  },
  {
    id: 'product_images',
    name: 'Imagens',
    description: 'Imagens dos produtos'
  },
  {
    id: 'banners',
    name: 'Banners',
    description: 'Banners do site'
  },
  {
    id: 'site_settings',
    name: 'Configurações',
    description: 'Configurações do site'
  },
  {
    id: 'leads',
    name: 'Leads',
    description: 'Contatos e leads'
  },
  {
    id: 'admin_users',
    name: 'Usuários Admin',
    description: 'Usuários administrativos'
  }
];

// Utilitários de tipo
export type BackupJobWithFiles = BackupJob & { files?: BackupFile[] };
export type BackupScheduleWithStats = BackupSchedule & { 
  last_job?: BackupJob;
  total_backups?: number;
  success_rate?: number;
};