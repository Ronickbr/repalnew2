import React, { useState } from 'react';
import { 
  Download, 
  Database, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useBackupJobs } from '../../hooks/useBackup';
import { AVAILABLE_TABLES, BACKUP_FORMATS } from '../../types/backup';
import { CreateBackupJobRequest } from '../../types/backup';

interface BackupManualProps {
  onBackupCreated?: () => void;
  onBackupComplete?: () => void;
}

const BackupManual: React.FC<BackupManualProps> = ({ onBackupCreated, onBackupComplete: _onBackupComplete }) => {
  const { createJob, loading } = useBackupJobs();
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [format, setFormat] = useState<'sql' | 'json' | 'csv'>('sql');
  const [compression, setCompression] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTableToggle = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId)
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTables.length === AVAILABLE_TABLES.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(AVAILABLE_TABLES.map(table => table.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (selectedTables.length === 0) {
      setError('Selecione pelo menos uma tabela para backup');
      return;
    }

    try {
      const request: CreateBackupJobRequest = {
        tables: selectedTables,
        format,
        compression
      };

      const job = await createJob(request);
      setSuccess(`Backup criado com sucesso! ID: ${job.id}`);
      
      // Reset form
      setSelectedTables([]);
      setFormat('sql');
      setCompression(false);
      setShowAdvanced(false);
      
      onBackupCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar backup');
    }
  };

  const isAllSelected = selectedTables.length === AVAILABLE_TABLES.length;
  const selectedTablesInfo = AVAILABLE_TABLES.filter(table => 
    selectedTables.includes(table.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Backup Manual</h2>
        <p className="text-gray-600">Crie um backup imediato das tabelas selecionadas</p>
      </div>

      {/* Mensagens de feedback */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de Tabelas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Database className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Tabelas para Backup</h3>
            </div>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {isAllSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AVAILABLE_TABLES.map((table) => (
              <label
                key={table.id}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedTables.includes(table.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTables.includes(table.id)}
                  onChange={() => handleTableToggle(table.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {table.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {table.description}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {selectedTables.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>{selectedTables.length}</strong> tabela(s) selecionada(s): {' '}
                {selectedTablesInfo.map(table => table.name).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Configurações Básicas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações</h3>
          
          <div className="space-y-4">
            {/* Formato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato do Backup
              </label>
              <div className="grid grid-cols-3 gap-3">
                {BACKUP_FORMATS.map((formatOption) => (
                  <label
                    key={formatOption}
                    className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      format === formatOption
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={formatOption}
                      checked={format === formatOption}
                      onChange={(e) => setFormat(e.target.value as 'sql' | 'json' | 'csv')}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium uppercase">
                      {formatOption}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                SQL: Estrutura e dados completos | JSON: Dados em formato JSON | CSV: Dados tabulares
              </p>
            </div>

            {/* Compressão */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={compression}
                  onChange={(e) => setCompression(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Comprimir arquivo de backup (recomendado)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Reduz o tamanho do arquivo em até 70%
              </p>
            </div>
          </div>
        </div>

        {/* Configurações Avançadas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            <Settings className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Configurações Avançadas</span>
            <span className="ml-2 text-xs text-gray-500">
              {showAdvanced ? '(ocultar)' : '(mostrar)'}
            </span>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      Informações Importantes
                    </h4>
                    <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                      <li>• O backup será processado em segundo plano</li>
                      <li>• Você receberá uma notificação quando concluído</li>
                      <li>• Backups grandes podem levar alguns minutos</li>
                      <li>• O arquivo ficará disponível por 30 dias</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimativa de Tamanho
                  </label>
                  <p className="text-sm text-gray-600">
                    {selectedTables.length === 0 
                      ? 'Selecione tabelas para ver estimativa'
                      : `Aproximadamente ${Math.round(selectedTables.length * 2.5)}MB`
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempo Estimado
                  </label>
                  <p className="text-sm text-gray-600">
                    {selectedTables.length === 0 
                      ? 'Selecione tabelas para ver estimativa'
                      : `${Math.max(1, Math.round(selectedTables.length * 0.5))} minuto(s)`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {selectedTables.length > 0 && (
              <span>
                {selectedTables.length} tabela(s) selecionada(s) • Formato: {format.toUpperCase()}
                {compression && ' • Comprimido'}
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                setSelectedTables([]);
                setFormat('sql');
                setCompression(false);
                setShowAdvanced(false);
                setError(null);
                setSuccess(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Limpar
            </button>
            
            <button
              type="submit"
              disabled={loading || selectedTables.length === 0}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando Backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Criar Backup
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BackupManual;