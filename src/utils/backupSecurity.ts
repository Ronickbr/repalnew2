import { supabase } from '../lib/supabase';

// Tipos para validação de segurança
export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BackupSecurityConfig {
  maxBackupSize: number; // em bytes
  maxRetentionDays: number;
  allowedFormats: string[];
  allowedTables: string[];
  requireConfirmation: boolean;
  maxConcurrentJobs: number;
}

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

// Configuração padrão de segurança
export const DEFAULT_SECURITY_CONFIG: BackupSecurityConfig = {
  maxBackupSize: 100 * 1024 * 1024, // 100MB
  maxRetentionDays: 90,
  allowedFormats: ['sql', 'json', 'csv'],
  allowedTables: [
    'products',
    'categories', 
    'subcategories',
    'product_images',
    'leads',
    'banners',
    'site_settings',
    'admin_users',
    'site_config',
    'profiles'
  ],
  requireConfirmation: true,
  maxConcurrentJobs: 3
};

// Validar permissões do usuário
export const validateUserPermissions = async (_userId?: string): Promise<SecurityValidationResult> => {
  const result: SecurityValidationResult = {
    isValid: false,
    errors: [],
    warnings: []
  };

  try {
    // Obter usuário do sistema customizado
    const user = getCurrentUser();
    
    if (!user) {
      result.errors.push('Usuário não encontrado ou inativo');
      return result;
    }

    // Verificar se o usuário está ativo
    if (!user.active) {
      result.errors.push('Usuário inativo');
      return result;
    }

    // Verificar se é administrador
    if (user.role !== 'admin') {
      result.errors.push('Acesso negado. Apenas administradores podem realizar backups');
      return result;
    }

    // Verificar se o usuário ainda existe no banco de dados
    const { data: dbUser, error: dbError } = await supabase
      .from('admin_users')
      .select('id, active, role')
      .eq('id', user.id)
      .single();

    if (dbError || !dbUser) {
      result.errors.push('Usuário não encontrado no banco de dados');
      return result;
    }

    if (!dbUser.active) {
      result.errors.push('Usuário inativo no banco de dados');
      return result;
    }

    if (dbUser.role !== 'admin') {
      result.errors.push('Usuário não possui permissões de administrador');
      return result;
    }

    result.isValid = true;
    return result;

  } catch (error) {
    console.error('Erro na validação de permissões:', error);
    result.errors.push('Erro interno na validação de permissões');
    return result;
  }
};

// Validar configuração de backup
export const validateBackupConfig = (
  tables: string[],
  format: string,
  retentionDays?: number,
  config: BackupSecurityConfig = DEFAULT_SECURITY_CONFIG
): SecurityValidationResult => {
  const result: SecurityValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Validar tabelas
  if (!tables || tables.length === 0) {
    result.errors.push('Pelo menos uma tabela deve ser selecionada');
    result.isValid = false;
  }

  const invalidTables = tables.filter(table => !config.allowedTables.includes(table));
  if (invalidTables.length > 0) {
    result.errors.push(`Tabelas não permitidas: ${invalidTables.join(', ')}`);
    result.isValid = false;
  }

  // Validar formato
  if (!config.allowedFormats.includes(format)) {
    result.errors.push(`Formato não permitido: ${format}`);
    result.isValid = false;
  }

  // Validar retenção
  if (retentionDays && retentionDays > config.maxRetentionDays) {
    result.errors.push(`Período de retenção muito longo. Máximo: ${config.maxRetentionDays} dias`);
    result.isValid = false;
  }

  // Avisos de segurança
  if (tables.includes('profiles')) {
    result.warnings.push('Backup inclui dados de usuários. Certifique-se de que está autorizado.');
  }

  if (retentionDays && retentionDays > 30) {
    result.warnings.push('Período de retenção longo pode ocupar muito espaço de armazenamento.');
  }

  return result;
};

// Validar limites de jobs concorrentes
export const validateConcurrentJobs = async (
  config: BackupSecurityConfig = DEFAULT_SECURITY_CONFIG
): Promise<SecurityValidationResult> => {
  const result: SecurityValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // Contar jobs em execução
    const { count: runningJobs } = await supabase
      .from('backup_jobs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'running']);

    if (runningJobs && runningJobs >= config.maxConcurrentJobs) {
      result.errors.push(`Muitos jobs em execução. Máximo: ${config.maxConcurrentJobs}`);
      result.isValid = false;
    }

    if (runningJobs && runningJobs >= config.maxConcurrentJobs - 1) {
      result.warnings.push('Próximo do limite de jobs concorrentes');
    }

    return result;

  } catch (error) {
    console.error('Erro na validação de jobs concorrentes:', error);
    result.errors.push('Erro ao verificar jobs em execução');
    result.isValid = false;
    return result;
  }
};

// Validar tamanho estimado do backup
export const validateBackupSize = async (
  tables: string[],
  config: BackupSecurityConfig = DEFAULT_SECURITY_CONFIG
): Promise<SecurityValidationResult> => {
  const result: SecurityValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // Estimar tamanho baseado nas tabelas selecionadas
    let estimatedSize = 0;

    for (const table of tables) {
      // Simular estimativa de tamanho (em produção, seria calculado baseado nos dados reais)
      const tableSize = await estimateTableSize(table);
      estimatedSize += tableSize;
    }

    if (estimatedSize > config.maxBackupSize) {
      result.errors.push(`Backup muito grande. Tamanho estimado: ${formatBytes(estimatedSize)}, máximo: ${formatBytes(config.maxBackupSize)}`);
      result.isValid = false;
    }

    if (estimatedSize > config.maxBackupSize * 0.8) {
      result.warnings.push(`Backup grande. Tamanho estimado: ${formatBytes(estimatedSize)}`);
    }

    return result;

  } catch (error) {
    console.error('Erro na validação de tamanho:', error);
    result.warnings.push('Não foi possível estimar o tamanho do backup');
    return result;
  }
};

// Validar frequência de backups
export const validateBackupFrequency = async (userId: string): Promise<SecurityValidationResult> => {
  const result: SecurityValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // Verificar backups recentes do usuário
    const { data: recentBackups } = await supabase
      .from('backup_jobs')
      .select('created_at')
      .eq('created_by', userId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // última hora
      .order('created_at', { ascending: false });

    if (recentBackups && recentBackups.length >= 5) {
      result.errors.push('Muitos backups criados recentemente. Aguarde antes de criar outro.');
      result.isValid = false;
    }

    if (recentBackups && recentBackups.length >= 3) {
      result.warnings.push('Vários backups criados recentemente');
    }

    return result;

  } catch (error) {
    console.error('Erro na validação de frequência:', error);
    result.warnings.push('Não foi possível verificar frequência de backups');
    return result;
  }
};

// Validar operação de restauração
export const validateRestoreOperation = async (
  backupId: string,
  _userId: string,
  tables: string[]
): Promise<SecurityValidationResult> => {
  const result: SecurityValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // Verificar se o backup existe e está completo
    const { data: backup } = await supabase
      .from('backup_jobs')
      .select('status, created_at, tables_included')
      .eq('id', backupId)
      .single();

    if (!backup) {
      result.errors.push('Backup não encontrado');
      result.isValid = false;
      return result;
    }

    if (backup.status !== 'completed') {
      result.errors.push('Backup não está completo');
      result.isValid = false;
      return result;
    }

    // Verificar se o backup não é muito antigo
    const backupAge = Date.now() - new Date(backup.created_at).getTime();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias

    if (backupAge > maxAge) {
      result.warnings.push('Backup é muito antigo. Verifique se os dados são compatíveis.');
    }

    // Verificar tabelas críticas
    const criticalTables = ['profiles', 'site_config'];
    const hasCriticalTables = tables.some(table => criticalTables.includes(table));

    if (hasCriticalTables) {
      result.warnings.push('ATENÇÃO: Restauração inclui tabelas críticas do sistema. Esta operação é irreversível.');
    }

    return result;

  } catch (error) {
    console.error('Erro na validação de restauração:', error);
    result.errors.push('Erro ao validar operação de restauração');
    result.isValid = false;
    return result;
  }
};

// Função auxiliar para estimar tamanho da tabela
const estimateTableSize = async (tableName: string): Promise<number> => {
  try {
    // Simular estimativa baseada no nome da tabela
    const estimates: Record<string, number> = {
      'products': 5 * 1024 * 1024, // 5MB
      'categories': 100 * 1024, // 100KB
      'leads': 2 * 1024 * 1024, // 2MB
      'banners': 1 * 1024 * 1024, // 1MB
      'site_config': 50 * 1024, // 50KB
      'profiles': 500 * 1024 // 500KB
    };

    return estimates[tableName] || 1024 * 1024; // 1MB padrão
  } catch (error) {
    console.error('Erro ao estimar tamanho da tabela:', error);
    return 1024 * 1024; // 1MB padrão
  }
};

// Função auxiliar para formatar bytes
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Função principal de validação de segurança
export const validateBackupSecurity = async (
  userId: string,
  tables: string[],
  format: string,
  retentionDays?: number,
  config: BackupSecurityConfig = DEFAULT_SECURITY_CONFIG
): Promise<SecurityValidationResult> => {
  const results: SecurityValidationResult[] = [];

  // Executar todas as validações
  results.push(await validateUserPermissions(userId));
  results.push(validateBackupConfig(tables, format, retentionDays, config));
  results.push(await validateConcurrentJobs(config));
  results.push(await validateBackupSize(tables, config));
  results.push(await validateBackupFrequency(userId));

  // Consolidar resultados
  const consolidatedResult: SecurityValidationResult = {
    isValid: results.every(r => r.isValid),
    errors: results.flatMap(r => r.errors),
    warnings: results.flatMap(r => r.warnings)
  };

  return consolidatedResult;
};

// Função para validar segurança de restauração
export const validateRestoreSecurity = async (
  backupId: string,
  userId: string,
  tables: string[]
): Promise<SecurityValidationResult> => {
  const results: SecurityValidationResult[] = [];

  // Executar validações de restauração
  results.push(await validateUserPermissions(userId));
  results.push(await validateRestoreOperation(backupId, userId, tables));

  // Consolidar resultados
  const consolidatedResult: SecurityValidationResult = {
    isValid: results.every(r => r.isValid),
    errors: results.flatMap(r => r.errors),
    warnings: results.flatMap(r => r.warnings)
  };

  return consolidatedResult;
};