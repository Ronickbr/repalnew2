import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  Play, 
  Pause,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useBackupSchedules } from '../../hooks/useBackup';
import { 
  AVAILABLE_TABLES, 
  BACKUP_FORMATS, 
  BACKUP_FREQUENCIES,
  CreateBackupScheduleRequest,
  BackupSchedule
} from '../../types/backup';
import { formatDate } from '../../utils/format';

interface BackupSchedulerProps {
  onScheduleChange?: () => void;
}

const BackupScheduler: React.FC<BackupSchedulerProps> = ({ onScheduleChange }) => {
  const { schedules, loading, error, fetchSchedules, createSchedule, updateSchedule, deleteSchedule, toggleSchedule } = useBackupSchedules();
  
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BackupSchedule | null>(null);
  const [formData, setFormData] = useState<CreateBackupScheduleRequest>({
    name: '',
    frequency: 'daily',
    execution_time: '02:00',
    execution_day: undefined,
    tables_config: [],
    format: 'sql',
    compression: true,
    retention_days: 30,
    active: true
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const resetForm = () => {
    setFormData({
      name: '',
      frequency: 'daily',
      execution_time: '02:00',
      execution_day: undefined,
      tables_config: [],
      format: 'sql',
      compression: true,
      retention_days: 30,
      active: true
    });
    setEditingSchedule(null);
    setShowForm(false);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleEdit = (schedule: BackupSchedule) => {
    setFormData({
      name: schedule.name,
      frequency: schedule.frequency,
      execution_time: schedule.execution_time,
      execution_day: schedule.execution_day,
      tables_config: schedule.tables_config,
      format: schedule.format,
      compression: schedule.compression,
      retention_days: schedule.retention_days,
      active: schedule.active
    });
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleTableToggle = (tableId: string) => {
    setFormData(prev => ({
      ...prev,
      tables_config: prev.tables_config.includes(tableId)
        ? prev.tables_config.filter(id => id !== tableId)
        : [...prev.tables_config, tableId]
    }));
  };

  const handleSelectAllTables = () => {
    const allTableIds = AVAILABLE_TABLES.map(table => table.id);
    setFormData(prev => ({
      ...prev,
      tables_config: prev.tables_config.length === allTableIds.length ? [] : allTableIds
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.name.trim()) {
      setFormError('Nome do agendamento é obrigatório');
      return;
    }

    if (formData.tables_config.length === 0) {
      setFormError('Selecione pelo menos uma tabela');
      return;
    }

    if (formData.frequency === 'weekly' && !formData.execution_day) {
      setFormError('Selecione o dia da semana para backup semanal');
      return;
    }

    if (formData.frequency === 'monthly' && (!formData.execution_day || formData.execution_day < 1 || formData.execution_day > 28)) {
      setFormError('Selecione um dia válido do mês (1-28)');
      return;
    }

    try {
      if (editingSchedule) {
        await updateSchedule({
          id: editingSchedule.id,
          ...formData
        });
        setFormSuccess('Agendamento atualizado com sucesso!');
      } else {
        await createSchedule(formData);
        setFormSuccess('Agendamento criado com sucesso!');
      }
      
      setTimeout(() => {
        resetForm();
        onScheduleChange?.();
      }, 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar agendamento');
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
      return;
    }

    try {
      await deleteSchedule(scheduleId);
      onScheduleChange?.();
    } catch (err) {
      console.error('Erro ao deletar agendamento:', err);
    }
  };

  const handleToggle = async (scheduleId: string, active: boolean) => {
    try {
      await toggleSchedule(scheduleId, active);
      onScheduleChange?.();
    } catch (err) {
      console.error('Erro ao alterar status do agendamento:', err);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      default: return frequency;
    }
  };

  const getDayLabel = (frequency: string, day?: number) => {
    if (frequency === 'weekly' && day !== undefined) {
      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      return days[day];
    }
    if (frequency === 'monthly' && day !== undefined) {
      return `Dia ${day}`;
    }
    return '';
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando agendamentos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agendamento de Backups</h2>
          <p className="text-gray-600">Configure backups automáticos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </button>
      </div>

      {/* Mensagens de erro global */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Lista de Agendamentos */}
      <div className="space-y-4">
        {schedules.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum agendamento configurado
            </h3>
            <p className="text-gray-600 mb-4">
              Crie seu primeiro agendamento para automatizar os backups
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Agendamento
            </button>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {schedule.name}
                    </h3>
                    <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                      schedule.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {schedule.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Frequência:</span>
                      <br />
                      {getFrequencyLabel(schedule.frequency)}
                      {schedule.execution_day && (
                        <span> - {getDayLabel(schedule.frequency, schedule.execution_day)}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Horário:</span>
                      <br />
                      {schedule.execution_time}
                    </div>
                    <div>
                      <span className="font-medium">Próxima execução:</span>
                      <br />
                      {schedule.next_run ? formatDate(schedule.next_run) : 'Não agendado'}
                    </div>
                    <div>
                      <span className="font-medium">Tabelas:</span>
                      <br />
                      {schedule.tables_config.length} selecionada(s)
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {schedule.format.toUpperCase()}
                    </span>
                    {schedule.compression && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        Comprimido
                      </span>
                    )}
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      Retenção: {schedule.retention_days} dias
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggle(schedule.id, !schedule.active)}
                    className={`p-2 rounded-lg transition-colors ${
                      schedule.active
                        ? 'text-orange-600 hover:bg-orange-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={schedule.active ? 'Pausar' : 'Ativar'}
                  >
                    {schedule.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Mensagens de feedback */}
              {formSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700">{formSuccess}</span>
                  </div>
                </div>
              )}

              {formError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-700">{formError}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Agendamento
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Backup Diário Completo"
                  />
                </div>

                {/* Frequência e Horário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequência
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        frequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                        execution_day: e.target.value === 'daily' ? undefined : prev.execution_day
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      {BACKUP_FREQUENCIES.map(freq => (
                        <option key={freq} value={freq}>
                          {getFrequencyLabel(freq)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={formData.execution_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, execution_time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Dia da execução (para semanal/mensal) */}
                {formData.frequency !== 'daily' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.frequency === 'weekly' ? 'Dia da Semana' : 'Dia do Mês'}
                    </label>
                    {formData.frequency === 'weekly' ? (
                      <select
                        value={formData.execution_day || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          execution_day: e.target.value ? parseInt(e.target.value) : undefined 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione o dia</option>
                        <option value="0">Domingo</option>
                        <option value="1">Segunda-feira</option>
                        <option value="2">Terça-feira</option>
                        <option value="3">Quarta-feira</option>
                        <option value="4">Quinta-feira</option>
                        <option value="5">Sexta-feira</option>
                        <option value="6">Sábado</option>
                      </select>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        max="28"
                        value={formData.execution_day || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          execution_day: e.target.value ? parseInt(e.target.value) : undefined 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Dia do mês (1-28)"
                      />
                    )}
                  </div>
                )}

                {/* Seleção de Tabelas */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Tabelas para Backup
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllTables}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {formData.tables_config.length === AVAILABLE_TABLES.length 
                        ? 'Desmarcar Todas' 
                        : 'Selecionar Todas'
                      }
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {AVAILABLE_TABLES.map((table) => (
                      <label
                        key={table.id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.tables_config.includes(table.id)}
                          onChange={() => handleTableToggle(table.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-2">
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
                </div>

                {/* Configurações do Backup */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formato
                    </label>
                    <select
                      value={formData.format}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        format: e.target.value as 'sql' | 'json' | 'csv' 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      {BACKUP_FORMATS.map(format => (
                        <option key={format} value={format}>
                          {format.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Retenção (dias)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.retention_days}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        retention_days: parseInt(e.target.value) || 30 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.compression}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          compression: e.target.checked 
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Comprimir
                      </span>
                    </label>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {editingSchedule ? 'Atualizar' : 'Criar'} Agendamento
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupScheduler;