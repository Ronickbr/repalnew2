import React, { useState, useEffect } from 'react';
import { 
  History, 
  Download, 
  Trash2, 
  Filter, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Database
} from 'lucide-react';
import { useBackupJobs, useBackupFiles } from '../../hooks/useBackup';
import { BackupHistoryFilters, BackupJob } from '../../types/backup';
import { formatBytes, formatDate, formatDuration } from '../../utils/format';

interface BackupHistoryProps {
  onRefresh?: () => void;
}

const BackupHistory: React.FC<BackupHistoryProps> = ({ onRefresh }) => {
  const { jobs, loading, error, fetchJobs, deleteJob } = useBackupJobs();
  const { downloadFile } = useBackupFiles();
  
  const [filters, setFilters] = useState<BackupHistoryFilters>({
    page: 1,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<BackupJob | null>(null);

  useEffect(() => {
    fetchJobs(filters);
  }, [fetchJobs, filters]);

  const handleFilterChange = (newFilters: Partial<BackupHistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Implementar busca local ou adicionar filtro de busca na API
  };

  const handleDownload = async (_jobId: string, fileId: string) => {
    try {
      await downloadFile(fileId);
    } catch (err) {
      console.error('Erro ao fazer download:', err);
    }
  };

  const [deletingJobs, setDeletingJobs] = useState<Set<string>>(new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const handleDelete = async (jobId: string) => {
    if (!confirm('Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingJobs(prev => new Set(prev).add(jobId));
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      await deleteJob(jobId);
      setDeleteSuccess('Backup excluído com sucesso!');
      onRefresh?.();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setDeleteSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar backup';
      setDeleteError(errorMessage);
      console.error('Erro ao deletar backup:', err);
      
      // Limpar mensagem de erro após 5 segundos
      setTimeout(() => setDeleteError(null), 5000);
    } finally {
      setDeletingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: BackupJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: BackupJob['status']) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'failed': return 'Falhou';
      case 'running': return 'Em execução';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const getStatusColor = (status: BackupJob['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (!searchTerm) return true;
    return job.tables_included.some(table => 
      table.toLowerCase().includes(searchTerm.toLowerCase())
    ) || job.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando histórico...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Histórico de Backups</h2>
          <p className="text-gray-600">Visualize e gerencie backups anteriores</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
          <button
            onClick={() => fetchJobs(filters)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Mensagens de feedback */}
      {deleteSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">{deleteSuccess}</span>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{deleteError}</span>
          </div>
        </div>
      )}

      {/* Mensagens de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange({ 
                  status: e.target.value as BackupJob['status'] || undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="completed">Concluído</option>
                <option value="failed">Falhou</option>
                <option value="running">Em execução</option>
                <option value="pending">Pendente</option>
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={filters.job_type || ''}
                onChange={(e) => handleFilterChange({ 
                  job_type: e.target.value as BackupJob['job_type'] || undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="manual">Manual</option>
                <option value="scheduled">Agendado</option>
              </select>
            </div>

            {/* Data inicial */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data inicial
              </label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange({ date_from: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Data final */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data final
              </label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange({ date_to: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => {
                setFilters({ page: 1, limit: 10 });
                setSearchTerm('');
              }}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Limpar filtros
            </button>
            <div className="text-sm text-gray-600">
              {filteredJobs.length} backup(s) encontrado(s)
            </div>
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por ID ou tabelas..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Lista de Backups */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum backup encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm || Object.keys(filters).length > 2
                ? 'Tente ajustar os filtros de busca'
                : 'Nenhum backup foi realizado ainda'
              }
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    {getStatusIcon(job.status)}
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                      {getStatusLabel(job.status)}
                    </span>
                    <span className="ml-3 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {job.job_type === 'manual' ? 'Manual' : 'Agendado'}
                    </span>
                    <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {job.format.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium text-gray-900">ID:</span>
                      <br />
                      <span className="font-mono text-xs">{job.id.substring(0, 8)}...</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Criado em:</span>
                      <br />
                      {formatDate(job.created_at)}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">
                        {job.status === 'completed' ? 'Concluído em:' : 'Iniciado em:'}
                      </span>
                      <br />
                      {job.completed_at 
                        ? formatDate(job.completed_at)
                        : job.started_at 
                        ? formatDate(job.started_at)
                        : 'Não iniciado'
                      }
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Duração:</span>
                      <br />
                      {job.started_at && job.completed_at
                        ? formatDuration(job.started_at, job.completed_at)
                        : job.started_at && job.status === 'running'
                        ? 'Em execução...'
                        : 'N/A'
                      }
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="font-medium text-gray-900 text-sm">Tabelas incluídas:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {job.tables_included.map((table, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {table}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arquivos de backup */}
                  {job.files && job.files.length > 0 && (
                    <div className="mb-4">
                      <span className="font-medium text-gray-900 text-sm">Arquivos:</span>
                      <div className="mt-2 space-y-2">
                        {job.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 text-gray-500 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {file.file_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatBytes(file.file_size)} • Downloads: {file.download_count}
                                  {file.expires_at && (
                                    <span> • Expira em: {formatDate(file.expires_at)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDownload(job.id, file.id)}
                              className="flex items-center px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensagem de erro */}
                  {job.status === 'failed' && job.error_message && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-red-800">Erro:</div>
                          <div className="text-sm text-red-700">{job.error_message}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Ver detalhes"
                  >
                    <Database className="h-4 w-4" />
                  </button>
                  {job.status === 'completed' && (
                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={deletingJobs.has(job.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        deletingJobs.has(job.id)
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title={deletingJobs.has(job.id) ? "Excluindo..." : "Excluir backup"}
                    >
                      {deletingJobs.has(job.id) ? (
                        <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Detalhes expandidos */}
              {selectedJob?.id === job.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Detalhes do Backup</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">ID completo:</span>
                      <div className="font-mono text-xs text-gray-600 break-all">{job.id}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Compressão:</span>
                      <div className="text-gray-600">{job.compression ? 'Ativada' : 'Desativada'}</div>
                    </div>
                    {job.schedule_id && (
                      <div>
                        <span className="font-medium text-gray-700">ID do agendamento:</span>
                        <div className="font-mono text-xs text-gray-600">{job.schedule_id}</div>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Criado por:</span>
                      <div className="font-mono text-xs text-gray-600">{job.created_by}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      {filteredJobs.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {Math.min((filters.page || 1 - 1) * (filters.limit || 10) + 1, filteredJobs.length)} - {Math.min((filters.page || 1) * (filters.limit || 10), filteredJobs.length)} de {filteredJobs.length} backups
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleFilterChange({ page: (filters.page || 1) - 1 })}
              disabled={!filters.page || filters.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Página {filters.page || 1}
            </span>
            <button
              onClick={() => handleFilterChange({ page: (filters.page || 1) + 1 })}
              disabled={filteredJobs.length < (filters.limit || 10)}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupHistory;