# Funcionalidade de Backup - Especificações de Implementação

## 1. Integração com a Página de Administração Existente

### 1.1 Modificações na Estrutura Atual

A funcionalidade de backup será integrada à seção de configurações existente na página `Admin.tsx`. As seguintes modificações serão necessárias:

**Adição de Nova Aba na Seção Configurações:**
```typescript
// Adicionar ao enum de abas existente
type AdminTab = 'dashboard' | 'products' | 'categories' | 'leads' | 'banners' | 'settings' | 'backup';

// Adicionar estado para sub-abas de backup
const [backupTab, setBackupTab] = useState<'dashboard' | 'manual' | 'schedule' | 'history' | 'restore'>('dashboard');
```

**Estrutura de Navegação:**
```
Administração
├── Dashboard
├── Produtos
├── Categorias
├── Leads
├── Banners
├── Configurações
│   ├── Configurações do Site
│   └── Backup do Banco de Dados ← NOVA SEÇÃO
│       ├── Painel Principal
│       ├── Backup Manual
│       ├── Agendamento
│       ├── Histórico
│       └── Restauração
```

### 1.2 Componentes de Interface

**BackupSection.tsx** - Componente principal integrado às configurações:
```typescript
interface BackupSectionProps {
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

const BackupSection: React.FC<BackupSectionProps> = ({ activeSubTab, onSubTabChange }) => {
  return (
    <div className="space-y-6">
      {/* Navegação por sub-abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {/* Sub-abas de backup */}
        </nav>
      </div>
      
      {/* Conteúdo baseado na sub-aba ativa */}
      {activeSubTab === 'dashboard' && <BackupDashboard />}
      {activeSubTab === 'manual' && <BackupManual />}
      {activeSubTab === 'schedule' && <BackupScheduler />}
      {activeSubTab === 'history' && <BackupHistory />}
      {activeSubTab === 'restore' && <BackupRestore />}
    </div>
  );
};
```

## 2. Funcionalidades Detalhadas

### 2.1 Painel Principal de Backup

**Componente: BackupDashboard.tsx**

Funcionalidades:
- Exibir estatísticas gerais (último backup, próximo agendado, espaço usado)
- Mostrar status do sistema de backup
- Ações rápidas (backup manual, ver histórico)
- Alertas e notificações importantes

**Interface Visual:**
```typescript
const BackupDashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Card de Status Geral */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Status do Sistema</p>
            <p className="text-2xl font-bold text-green-600">Ativo</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>
      
      {/* Card de Último Backup */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Último Backup</p>
            <p className="text-lg font-semibold text-gray-900">Hoje, 02:00</p>
            <p className="text-sm text-gray-500">Backup automático completo</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Database className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>
      
      {/* Card de Próximo Backup */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Próximo Backup</p>
            <p className="text-lg font-semibold text-gray-900">Amanhã, 02:00</p>
            <p className="text-sm text-gray-500">Backup automático agendado</p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 2.2 Backup Manual

**Componente: BackupManual.tsx**

Funcionalidades:
- Seleção de tabelas específicas para backup
- Escolha do formato de exportação (SQL, JSON, CSV)
- Opção de compressão
- Geração e download do arquivo
- Barra de progresso em tempo real

**Tabelas Disponíveis para Backup:**
- `products` - Produtos do catálogo
- `categories` - Categorias principais
- `subcategories` - Subcategorias
- `product_images` - Imagens dos produtos
- `banners` - Banners do site
- `site_settings` - Configurações do site
- `leads` - Leads de contato
- `admin_users` - Usuários administrativos

**Interface de Seleção:**
```typescript
const BackupManual: React.FC = () => {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [format, setFormat] = useState<'sql' | 'json' | 'csv'>('sql');
  const [compression, setCompression] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const availableTables = [
    { id: 'products', name: 'Produtos', description: 'Catálogo completo de produtos' },
    { id: 'categories', name: 'Categorias', description: 'Categorias principais' },
    { id: 'subcategories', name: 'Subcategorias', description: 'Subcategorias dos produtos' },
    { id: 'product_images', name: 'Imagens', description: 'Imagens dos produtos' },
    { id: 'banners', name: 'Banners', description: 'Banners do site' },
    { id: 'site_settings', name: 'Configurações', description: 'Configurações do site' },
    { id: 'leads', name: 'Leads', description: 'Contatos e leads' },
    { id: 'admin_users', name: 'Usuários Admin', description: 'Usuários administrativos' }
  ];

  return (
    <div className="space-y-6">
      {/* Seleção de Tabelas */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Selecionar Tabelas para Backup
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableTables.map((table) => (
            <label key={table.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTables.includes(table.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTables([...selectedTables, table.id]);
                  } else {
                    setSelectedTables(selectedTables.filter(t => t !== table.id));
                  }
                }}
                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <div>
                <p className="font-medium text-gray-900">{table.name}</p>
                <p className="text-sm text-gray-500">{table.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Configurações de Exportação */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configurações de Exportação
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato do Arquivo
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'sql' | 'json' | 'csv')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="sql">SQL (.sql)</option>
              <option value="json">JSON (.json)</option>
              <option value="csv">CSV (.csv)</option>
            </select>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={compression}
                onChange={(e) => setCompression(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Aplicar compressão (ZIP)
              </span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Botão de Geração */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Gerar Backup
            </h3>
            <p className="text-sm text-gray-500">
              {selectedTables.length} tabela(s) selecionada(s)
            </p>
          </div>
          <button
            onClick={handleGenerateBackup}
            disabled={selectedTables.length === 0 || isGenerating}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Gerar Backup</span>
              </>
            )}
          </button>
        </div>
        
        {/* Barra de Progresso */}
        {isGenerating && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Gerando backup...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 2.3 Agendamento Automático

**Componente: BackupScheduler.tsx**

Funcionalidades:
- Configurar frequência (diário, semanal, mensal)
- Definir horário de execução
- Selecionar tabelas para backup automático
- Configurar retenção de arquivos
- Ativar/desativar agendamentos

### 2.4 Histórico de Backups

**Componente: BackupHistory.tsx**

Funcionalidades:
- Listar todos os backups realizados
- Filtros por data, tipo e status
- Informações detalhadas (tamanho, duração, tabelas)
- Download de backups anteriores
- Exclusão de backups antigos

### 2.5 Restauração de Dados

**Componente: BackupRestore.tsx**

Funcionalidades:
- Upload de arquivo de backup
- Validação do arquivo
- Preview das alterações
- Seleção de tabelas para restaurar
- Confirmação com modal de segurança
- Execução da restauração com progresso

## 3. Segurança e Validações

### 3.1 Controle de Acesso

- Apenas usuários com role 'admin' podem acessar funcionalidades de backup
- Logs de auditoria para todas as operações de backup/restauração
- Validação de integridade dos arquivos de backup

### 3.2 Validações de Dados

- Verificação de formato de arquivo antes da restauração
- Validação de checksum para garantir integridade
- Confirmação dupla para operações de restauração
- Backup automático antes de qualquer restauração

### 3.3 Tratamento de Erros

- Logs detalhados de erros durante backup/restauração
- Notificações por email em caso de falha
- Rollback automático em caso de erro na restauração
- Interface clara para exibição de erros ao usuário

## 4. Performance e Otimização

### 4.1 Estratégias de Performance

- Backup incremental para grandes volumes de dados
- Compressão automática para reduzir tamanho dos arquivos
- Processamento em background para não bloquear a interface
- Paginação no histórico de backups

### 4.2 Monitoramento

- Métricas de tempo de execução dos backups
- Monitoramento do espaço de armazenamento
- Alertas para backups que falharam
- Dashboard com estatísticas de uso

## 5. Cronograma de Implementação

### Fase 1 (Semana 1-2): Estrutura Base
- Criação das tabelas de backup no banco de dados
- Implementação dos hooks básicos
- Integração com a página de administração existente

### Fase 2 (Semana 3-4): Funcionalidades Core
- Implementação do backup manual
- Sistema de agendamento básico
- Interface de histórico

### Fase 3 (Semana 5-6): Funcionalidades Avançadas
- Sistema de restauração
- Notificações e alertas
- Otimizações de performance

### Fase 4 (Semana 7): Testes e Refinamentos
- Testes de integração
- Testes de segurança
- Ajustes finais na interface