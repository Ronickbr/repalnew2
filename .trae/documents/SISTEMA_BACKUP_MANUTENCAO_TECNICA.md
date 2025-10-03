# Manual de Manutenção Técnica - Sistema de Backup

## Arquitetura do Sistema

### Componentes Principais

#### Frontend (React + TypeScript)

```
src/
├── components/backup/
│   ├── BackupSection.tsx      # Componente principal
│   ├── BackupDashboard.tsx    # Dashboard com estatísticas
│   ├── BackupManual.tsx       # Interface para backup manual
│   ├── BackupScheduler.tsx    # Agendamento de backups
│   ├── BackupHistory.tsx      # Histórico de backups
│   └── BackupRestore.tsx      # Interface de restauração
├── hooks/
│   └── useBackup.ts           # Hook customizado para backup
├── types/
│   └── backup.ts              # Tipos TypeScript
└── utils/
    ├── backupApi.ts           # Funções de API
    ├── backupSecurity.ts      # Validações de segurança
    └── format.ts              # Utilitários de formatação
```

#### Backend (Express.js + Node.js)

```
api/
└── routes/
    └── backup.js              # Rotas da API de backup
server.js                      # Servidor principal
```

#### Banco de Dados (Supabase)

```sql
-- Tabelas principais
backup_jobs                    # Jobs de backup
backup_schedules              # Agendamentos
backup_files                  # Arquivos gerados
backup_logs                   # Logs de execução
```

## Estrutura de Dados

### Tabela: backup\_jobs

```sql
CREATE TABLE backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('manual', 'scheduled')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  tables_included TEXT[] NOT NULL,
  format VARCHAR(10) DEFAULT 'sql',
  compression BOOLEAN DEFAULT false,
  file_path TEXT,
  file_size BIGINT,
  checksum TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);
```

### Tabela: backup\_schedules

```sql
CREATE TABLE backup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency VARCHAR(20) NOT NULL,
  execution_time TIME NOT NULL,
  execution_day INTEGER,
  tables_config TEXT[] NOT NULL,
  format VARCHAR(10) DEFAULT 'sql',
  compression BOOLEAN DEFAULT false,
  retention_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);
```

## Configuração e Deploy

### Variáveis de Ambiente

```env
# Backend
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Frontend
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon
```

### Instalação de Dependências

```bash
# Instalar dependências
npm install

# Dependências específicas do backup
npm install express cors dotenv multer
```

### Execução

```bash
# Frontend
npm run dev

# Backend
npm run api
```

## Segurança e Permissões

### Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Admins can manage all backups" ON backup_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

### Permissões de Tabela

```sql
-- Conceder permissões aos roles
GRANT ALL PRIVILEGES ON backup_jobs TO authenticated;
GRANT ALL PRIVILEGES ON backup_schedules TO authenticated;
GRANT ALL PRIVILEGES ON backup_files TO authenticated;
GRANT ALL PRIVILEGES ON backup_logs TO authenticated;

GRANT SELECT ON backup_jobs TO anon;
GRANT SELECT ON backup_schedules TO anon;
```

## Monitoramento e Logs

### Sistema de Logs

* **backup\_logs**: Registra todas as operações

* **Console logs**: Debug no navegador

* **Server logs**: Logs do Express.js

### Métricas Importantes

* Taxa de sucesso dos backups

* Tempo médio de execução

* Espaço utilizado

* Frequência de falhas

### Alertas

* Backups falhados consecutivos

* Espaço em disco baixo

* Agendamentos não executados

## Manutenção Preventiva

### Limpeza Automática

```javascript
// Função para limpeza de backups antigos
const cleanupOldBackups = async (retentionDays = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  await supabase
    .from('backup_jobs')
    .delete()
    .lt('created_at', cutoffDate.toISOString());
};
```

### Verificação de Integridade

```javascript
// Validar checksums dos backups
const validateBackupIntegrity = async (backupId) => {
  const { data: backup } = await supabase
    .from('backup_jobs')
    .select('*')
    .eq('id', backupId)
    .single();
    
  // Verificar checksum
  const currentChecksum = await calculateChecksum(backup.file_path);
  return currentChecksum === backup.checksum;
};
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Permissão

```
Error: permission denied for table backup_jobs
```

**Solução:**

```sql
GRANT ALL PRIVILEGES ON backup_jobs TO authenticated;
```

#### 2. Falha na Conexão Supabase

```
Error: supabaseUrl is required
```

**Solução:**

* Verificar variáveis de ambiente

* Confirmar configuração do .env

#### 3. Backup Não Inicia

```
Error: Token inválido
```

**Solução:**

* Verificar autenticação do usuário

* Confirmar permissões de admin

### Debug Avançado

#### Logs Detalhados

```javascript
// Habilitar logs detalhados
console.debug('Backup iniciado:', {
  jobId,
  tables: selectedTables,
  format,
  compression
});
```

#### Monitoramento de Performance

```javascript
// Medir tempo de execução
const startTime = performance.now();
// ... operação de backup
const endTime = performance.now();
console.log(`Backup concluído em ${endTime - startTime}ms`);
```

## Backup e Recuperação do Sistema

### Backup da Configuração

```bash
# Exportar configurações
pg_dump -h seu-host -U seu-usuario -d seu-banco \
  -t backup_schedules -t backup_jobs > backup_config.sql
```

### Restauração de Emergência

```bash
# Restaurar configurações
psql -h seu-host -U seu-usuario -d seu-banco < backup_config.sql
```

## Atualizações e Versionamento

### Migração de Schema

```sql
-- Exemplo de migração
ALTER TABLE backup_jobs ADD COLUMN new_field TEXT;
UPDATE backup_jobs SET new_field = 'default_value';
```

### Compatibilidade

* **Frontend**: React 18+

* **Backend**: Node.js 18+

* **Banco**: PostgreSQL 13+

* **Supabase**: Versão atual

## Performance e Otimização

### Índices Recomendados

```sql
-- Índices para performance
CREATE INDEX idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX idx_backup_jobs_created_at ON backup_jobs(created_at);
CREATE INDEX idx_backup_schedules_next_run ON backup_schedules(next_run);
```

### Otimizações

* Compressão de backups grandes

* Limpeza automática de arquivos antigos

* Cache de estatísticas

* Paginação de resultados

## Contato Técnico

Para questões de desenvolvimento:

* **Documentação**: Consulte os arquivos .md na pasta .trae/documents

* **Código**: Verifique comentários inline nos componentes

* **Issues**: Registre problemas no sistema de controle de versão

***

**Versão**: 1.0\
**Última Atualização**: Outubro 2024\
**Responsável**: Equipe de Desenvolvimento
