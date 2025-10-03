import React, { useEffect } from 'react';
import { 
  Database, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  HardDrive, 
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useBackupStats } from '../../hooks/useBackup';
import { formatBytes, formatDate } from '../../utils/format';

interface BackupDashboardProps {
  onRefresh?: () => void;
}

const BackupDashboard: React.FC<BackupDashboardProps> = ({ onRefresh }) => {
  const { stats, loading, error, fetchStats } = useBackupStats();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    fetchStats();
    onRefresh?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando estatísticas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Erro ao carregar estatísticas: {error}</span>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8 text-gray-500">
        Nenhuma estatística disponível
      </div>
    );
  }

  const successRate = stats.total_jobs > 0 
    ? Math.round((stats.completed_jobs / stats.total_jobs) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Backup</h2>
          <p className="text-gray-600">Visão geral do sistema de backup</p>
        </div>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Atualizar
        </button>
      </div>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Backups */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Backups</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_jobs}</p>
            </div>
          </div>
        </div>

        {/* Backups Bem-sucedidos */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bem-sucedidos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed_jobs}</p>
              <p className="text-sm text-green-600">{successRate}% de sucesso</p>
            </div>
          </div>
        </div>

        {/* Backups Falhados */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Falhados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failed_jobs}</p>
            </div>
          </div>
        </div>

        {/* Armazenamento Usado */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <HardDrive className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Armazenamento</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatBytes(stats.total_backup_size)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Último Backup */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Último Backup</h3>
          </div>
          
          {stats.last_backup ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Data:</span>
                <span className="text-sm font-medium">
                  {formatDate(stats.last_backup)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="text-sm font-medium text-green-600">
                  Concluído
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhum backup realizado ainda</p>
          )}
        </div>

        {/* Próximo Agendamento */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Próximo Agendamento</h3>
          </div>
          
          {stats.next_backup ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Próxima execução:</span>
                <span className="text-sm font-medium">
                  {stats.next_backup 
                    ? formatDate(stats.next_backup)
                    : 'Não agendado'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nome:</span>
                <span className="text-sm font-medium">
                  {stats.next_backup_name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="text-sm font-medium text-green-600">
                  Ativo
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhum agendamento ativo</p>
          )}
        </div>
      </div>

      {/* Resumo de agendamentos ativos */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Resumo do Sistema</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.active_schedules}</p>
            <p className="text-sm text-gray-600">Agendamentos Ativos</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{successRate}%</p>
            <p className="text-sm text-gray-600">Taxa de Sucesso</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {formatBytes(stats.total_backup_size)}
            </p>
            <p className="text-sm text-gray-600">Espaço Utilizado</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupDashboard;