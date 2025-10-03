# Manual de Uso - Sistema de Backup

## Visão Geral

O Sistema de Backup foi implementado com sucesso na aplicação, fornecendo funcionalidades completas para backup, agendamento, histórico e restauração do banco de dados Supabase.

## Acesso ao Sistema

1. **Login**: Faça login como administrador na aplicação
2. **Navegação**: Acesse a página "Administração" no menu principal
3. **Backup**: Clique na aba "Backup" no menu lateral esquerdo

## Funcionalidades Disponíveis

### 1. Dashboard (Painel)
- **Estatísticas Gerais**: Visualize o número total de backups, backups bem-sucedidos e falhados
- **Último Backup**: Informações sobre o backup mais recente
- **Próximo Agendamento**: Detalhes do próximo backup agendado
- **Espaço Utilizado**: Monitoramento do espaço ocupado pelos backups

### 2. Backup Manual
- **Seleção de Tabelas**: Escolha quais tabelas incluir no backup
- **Formato**: Selecione entre SQL, JSON ou CSV
- **Compressão**: Opção para comprimir o arquivo de backup
- **Execução Imediata**: Inicie o backup manualmente

**Como usar:**
1. Selecione as tabelas desejadas
2. Escolha o formato de saída
3. Ative a compressão se necessário
4. Clique em "Iniciar Backup"

### 3. Agendamento de Backups
- **Frequência**: Configure backups diários, semanais ou mensais
- **Horário**: Defina o horário de execução
- **Configuração Avançada**: Personalize tabelas, formato e compressão
- **Gerenciamento**: Ative/desative agendamentos existentes

**Como configurar:**
1. Clique em "Novo Agendamento"
2. Defina a frequência (diário, semanal, mensal)
3. Configure o horário de execução
4. Selecione as tabelas e configurações
5. Salve o agendamento

### 4. Histórico de Backups
- **Lista Completa**: Visualize todos os backups realizados
- **Filtros**: Filtre por status, tipo ou período
- **Detalhes**: Veja informações detalhadas de cada backup
- **Download**: Baixe arquivos de backup concluídos

**Informações disponíveis:**
- Status do backup (concluído, em andamento, falhou)
- Data e hora de criação
- Tabelas incluídas
- Tamanho do arquivo
- Usuário responsável

### 5. Restauração de Backups
- **Seleção de Backup**: Escolha um backup para restaurar
- **Visualização**: Veja detalhes antes da restauração
- **Confirmação**: Sistema de confirmação para evitar acidentes
- **Monitoramento**: Acompanhe o progresso da restauração

**⚠️ ATENÇÃO:**
- A restauração substitui os dados atuais
- Sempre faça um backup antes de restaurar
- O processo é irreversível

## Segurança e Permissões

### Controle de Acesso
- Apenas administradores podem acessar o sistema de backup
- Autenticação obrigatória via token JWT
- Validação de permissões em todas as operações

### Validações de Segurança
- **Tabelas Permitidas**: Apenas tabelas autorizadas podem ser incluídas
- **Limite de Jobs**: Máximo de jobs concorrentes para evitar sobrecarga
- **Tamanho de Backup**: Validação do tamanho estimado
- **Frequência**: Controle de frequência mínima entre backups

## Configurações Técnicas

### Variáveis de Ambiente
```env
# Supabase (Backend)
SUPABASE_URL=sua_url_supabase
SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Supabase (Frontend)
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
```

### Estrutura do Banco de Dados
- **backup_jobs**: Registros de jobs de backup
- **backup_schedules**: Configurações de agendamento
- **backup_files**: Arquivos de backup gerados
- **backup_logs**: Logs de execução

### APIs Disponíveis
- `GET /api/backup/stats` - Estatísticas
- `POST /api/backup/jobs` - Criar backup
- `GET /api/backup/jobs` - Listar backups
- `POST /api/backup/schedules` - Criar agendamento
- `POST /api/backup/restore` - Restaurar backup

## Monitoramento e Manutenção

### Logs do Sistema
- Todos os backups são registrados em logs
- Erros são capturados e armazenados
- Histórico completo de operações

### Limpeza Automática
- Backups antigos são removidos automaticamente
- Configuração de retenção por agendamento
- Otimização de espaço em disco

### Alertas e Notificações
- Falhas de backup são registradas
- Status visível no dashboard
- Monitoramento em tempo real

## Solução de Problemas

### Problemas Comuns

**1. Backup Falha ao Iniciar**
- Verifique as permissões do usuário
- Confirme se as tabelas existem
- Verifique a conectividade com o banco

**2. Agendamento Não Executa**
- Verifique se o agendamento está ativo
- Confirme o horário configurado
- Verifique logs de erro

**3. Restauração Falha**
- Confirme se o arquivo de backup existe
- Verifique permissões de escrita
- Valide a integridade do arquivo

### Logs de Debug
Para debug avançado, verifique:
- Console do navegador (F12)
- Logs do servidor backend
- Logs do Supabase

## Contato e Suporte

Para questões técnicas ou problemas:
1. Verifique os logs do sistema
2. Consulte a documentação técnica
3. Entre em contato com a equipe de desenvolvimento

---

**Versão do Sistema**: 1.0  
**Última Atualização**: Outubro 2024  
**Compatibilidade**: React 18+, Node.js 18+, Supabase