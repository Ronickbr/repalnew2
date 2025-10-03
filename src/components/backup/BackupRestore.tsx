import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  Database,
  FileText,
  Shield,
  Clock,
  Loader2,
  Info
} from 'lucide-react';
import { useBackupJobs, useBackupRestore } from '../../hooks/useBackup';
import { BackupJobWithFiles, RestoreBackupRequest } from '../../types/backup';
import { formatBytes, formatDate } from '../../utils/format';

interface BackupRestoreProps {
  onRestoreComplete?: () => void;
}

const BackupRestore: React.FC<BackupRestoreProps> = ({ onRestoreComplete }) => {
  const { jobs, loading: jobsLoading, fetchJobs } = useBackupJobs();
  const { error: restoreError, restoreBackup, validateBackupFile } = useBackupRestore();
  
  const [selectedBackup, setSelectedBackup] = useState<BackupJobWithFiles | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [step, setStep] = useState<'select' | 'configure' | 'confirm' | 'restore'>('select');

  useEffect(() => {
    fetchJobs({ status: 'completed', limit: 50 });
  }, [fetchJobs]);

  const completedBackups = jobs.filter(job => 
    job.status === 'completed' && job.files && job.files.length > 0
  );

  const handleBackupSelect = async (backup: BackupJobWithFiles) => {
    setSelectedBackup(backup);
    setSelectedTables(backup.tables_included);
    setStep('configure');

    // Validar arquivo de backup
    if (backup.files && backup.files.length > 0) {
      try {
        const validation = await validateBackupFile(backup.files[0].id);
        setValidationResult(validation);
      } catch (err) {
        console.error('Erro na validação:', err);
      }
    }
  };

  const handleTableToggle = (table: string) => {
    setSelectedTables(prev => 
      prev.includes(table)
        ? prev.filter(t => t !== table)
        : [...prev, table]
    );
  };

  const handleSelectAllTables = () => {
    if (!selectedBackup) return;
    
    if (selectedTables.length === selectedBackup.tables_included.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables([...selectedBackup.tables_included]);
    }
  };

  const handleProceedToConfirm = () => {
    if (selectedTables.length === 0) {
      alert('Selecione pelo menos uma tabela para restaurar');
      return;
    }
    setStep('confirm');
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackup || !confirmRestore) {
      return;
    }

    setStep('restore');
    
    try {
      const request: RestoreBackupRequest = {
        backup_id: selectedBackup.id,
        tables: selectedTables,
        confirm: true
      };

      const result = await restoreBackup(request);
      setRestoreSuccess(`Restauração concluída com sucesso! ${result.affected_rows} registros restaurados.`);
      
      setTimeout(() => {
        resetForm();
        onRestoreComplete?.();
      }, 3000);
    } catch (err) {
      console.error('Erro na restauração:', err);
      setStep('confirm');
    }
  };

  const resetForm = () => {
    setSelectedBackup(null);
    setSelectedTables([]);
    setConfirmRestore(false);
    setRestoreSuccess(null);
    setValidationResult(null);
    setStep('select');
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'select', label: 'Selecionar Backup', icon: Database },
      { id: 'configure', label: 'Configurar', icon: FileText },
      { id: 'confirm', label: 'Confirmar', icon: Shield },
      { id: 'restore', label: 'Restaurar', icon: RotateCcw }
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((stepItem, index) => {
          const isActive = stepItem.id === step;
          const isCompleted = steps.findIndex(s => s.id === step) > index;
          const Icon = stepItem.icon;

          return (
            <React.Fragment key={stepItem.id}>
              <div className={`flex items-center ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  isActive 
                    ? 'border-blue-600 bg-blue-50' 
                    : isCompleted 
                    ? 'border-green-600 bg-green-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="ml-2 text-sm font-medium">{stepItem.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`mx-4 h-0.5 w-12 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (jobsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando backups...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Restaurar Backup</h2>
        <p className="text-gray-600">Restaure dados de um backup anterior</p>
      </div>

      {/* Indicador de etapas */}
      {renderStepIndicator()}

      {/* Mensagens de erro */}
      {restoreError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{restoreError}</span>
          </div>
        </div>
      )}

      {/* Mensagem de sucesso */}
      {restoreSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">{restoreSuccess}</span>
          </div>
        </div>
      )}

      {/* Etapa 1: Seleção de Backup */}
      {step === 'select' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Importante</h4>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• A restauração substituirá os dados atuais das tabelas selecionadas</li>
                  <li>• Recomendamos fazer um backup antes de restaurar</li>
                  <li>• O processo pode levar alguns minutos dependendo do tamanho dos dados</li>
                  <li>• Apenas backups concluídos com sucesso podem ser restaurados</li>
                </ul>
              </div>
            </div>
          </div>

          {completedBackups.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum backup disponível
              </h3>
              <p className="text-gray-600">
                Não há backups concluídos disponíveis para restauração
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Selecione um backup para restaurar:
              </h3>
              {completedBackups.map((backup) => (
                <div
                  key={backup.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleBackupSelect(backup)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Concluído
                        </span>
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                          {backup.job_type === 'manual' ? 'Manual' : 'Agendado'}
                        </span>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {backup.format.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium text-gray-900">Data:</span>
                          <br />
                          {formatDate(backup.completed_at || backup.created_at)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Tabelas:</span>
                          <br />
                          {backup.tables_included.length} tabela(s)
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Tamanho:</span>
                          <br />
                          {backup.files && backup.files.length > 0 
                            ? formatBytes(backup.files[0].file_size)
                            : 'N/A'
                          }
                        </div>
                      </div>

                      <div className="mt-2">
                        <span className="font-medium text-gray-900 text-sm">Tabelas incluídas:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {backup.tables_included.map((table, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {table}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <RotateCcw className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Etapa 2: Configuração */}
      {step === 'configure' && selectedBackup && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Backup Selecionado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Data:</span>
                <div className="text-gray-600">
                  {formatDate(selectedBackup.completed_at || selectedBackup.created_at)}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tipo:</span>
                <div className="text-gray-600">
                  {selectedBackup.job_type === 'manual' ? 'Manual' : 'Agendado'}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Formato:</span>
                <div className="text-gray-600">{selectedBackup.format.toUpperCase()}</div>
              </div>
            </div>
          </div>

          {/* Validação do arquivo */}
          {validationResult && (
            <div className={`p-4 rounded-lg border ${
              validationResult.is_valid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                {validationResult.is_valid ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className={`font-medium ${
                  validationResult.is_valid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.is_valid ? 'Arquivo válido' : 'Arquivo inválido'}
                </span>
              </div>
              <div className={`text-sm ${
                validationResult.is_valid ? 'text-green-700' : 'text-red-700'
              }`}>
                <p>Tipo: {validationResult.file_type}</p>
                <p>Registros estimados: {validationResult.estimated_records}</p>
                <p>Tamanho: {formatBytes(validationResult.file_size)}</p>
                {validationResult.errors && validationResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Erros:</p>
                    <ul className="list-disc list-inside">
                      {validationResult.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Seleção de tabelas */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Selecionar Tabelas para Restaurar
              </h3>
              <button
                onClick={handleSelectAllTables}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {selectedTables.length === selectedBackup.tables_included.length 
                  ? 'Desmarcar Todas' 
                  : 'Selecionar Todas'
                }
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedBackup.tables_included.map((table) => (
                <label
                  key={table}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTables.includes(table)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(table)}
                    onChange={() => handleTableToggle(table)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {table}
                  </span>
                </label>
              ))}
            </div>

            {selectedTables.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Atenção</p>
                    <p className="text-sm text-yellow-700">
                      Os dados atuais das {selectedTables.length} tabela(s) selecionada(s) 
                      serão substituídos pelos dados do backup.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botões de navegação */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('select')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleProceedToConfirm}
              disabled={selectedTables.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Etapa 3: Confirmação */}
      {step === 'confirm' && selectedBackup && (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Confirmação de Restauração
                </h3>
                <p className="text-red-700 mb-4">
                  Esta ação irá substituir permanentemente os dados atuais das tabelas selecionadas. 
                  Esta operação não pode ser desfeita.
                </p>
                
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <h4 className="font-medium text-gray-900 mb-2">Resumo da Restauração:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li><strong>Backup:</strong> {formatDate(selectedBackup.completed_at || selectedBackup.created_at)}</li>
                    <li><strong>Formato:</strong> {selectedBackup.format.toUpperCase()}</li>
                    <li><strong>Tabelas a restaurar:</strong> {selectedTables.length}</li>
                    <li><strong>Tabelas:</strong> {selectedTables.join(', ')}</li>
                  </ul>
                </div>

                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={confirmRestore}
                      onChange={(e) => setConfirmRestore(e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-red-800">
                      Eu entendo que esta ação substituirá permanentemente os dados atuais 
                      e não pode ser desfeita
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de navegação */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('configure')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirmRestore}
              disabled={!confirmRestore}
              className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Confirmar Restauração
            </button>
          </div>
        </div>
      )}

      {/* Etapa 4: Restauração em andamento */}
      {step === 'restore' && (
        <div className="text-center p-8">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-3" />
            <Clock className="h-6 w-6 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Restauração em Andamento
          </h3>
          <p className="text-gray-600 mb-4">
            Por favor, aguarde enquanto os dados são restaurados. 
            Este processo pode levar alguns minutos.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-block">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-sm text-yellow-700">
                Não feche esta página durante o processo de restauração
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupRestore;