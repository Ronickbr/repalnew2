import React, { useState } from 'react';
import { 
  Database, 
  Calendar, 
  History, 
  RotateCcw, 
  BarChart3,
  Settings,
  Shield,
  AlertCircle
} from 'lucide-react';
import BackupDashboard from './BackupDashboard';
import BackupManual from './BackupManual';
import BackupScheduler from './BackupScheduler';
import BackupHistory from './BackupHistory';
import BackupRestore from './BackupRestore';

type BackupTab = 'dashboard' | 'manual' | 'scheduler' | 'history' | 'restore';

interface BackupSectionProps {
  className?: string;
}

const BackupSection: React.FC<BackupSectionProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<BackupTab>('dashboard');

  const tabs = [
    {
      id: 'dashboard' as BackupTab,
      label: 'Painel',
      icon: BarChart3,
      description: 'Visão geral dos backups'
    },
    {
      id: 'manual' as BackupTab,
      label: 'Backup Manual',
      icon: Database,
      description: 'Criar backup imediatamente'
    },
    {
      id: 'scheduler' as BackupTab,
      label: 'Agendamento',
      icon: Calendar,
      description: 'Configurar backups automáticos'
    },
    {
      id: 'history' as BackupTab,
      label: 'Histórico',
      icon: History,
      description: 'Ver backups anteriores'
    },
    {
      id: 'restore' as BackupTab,
      label: 'Restaurar',
      icon: RotateCcw,
      description: 'Restaurar dados de backup'
    }
  ];

  const handleTabChange = (tabId: BackupTab) => {
    setActiveTab(tabId);
  };

  const handleBackupComplete = () => {
    // Atualizar dashboard quando backup for concluído
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  };

  const handleRestoreComplete = () => {
    // Voltar ao dashboard após restauração
    setActiveTab('dashboard');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <BackupDashboard />;
      case 'manual':
        return <BackupManual onBackupComplete={handleBackupComplete} />;
      case 'scheduler':
        return <BackupScheduler />;
      case 'history':
        return <BackupHistory />;
      case 'restore':
        return <BackupRestore onRestoreComplete={handleRestoreComplete} />;
      default:
        return <BackupDashboard />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Database className="h-7 w-7 text-blue-600 mr-3" />
              Sistema de Backup
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie backups do banco de dados, agendamentos e restaurações
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-600 font-medium">Sistema Seguro</span>
          </div>
        </div>

        {/* Aviso de segurança */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Informações Importantes</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Backups são armazenados de forma segura e criptografada</li>
                <li>• Recomendamos fazer backups regulares antes de atualizações importantes</li>
                <li>• A restauração substitui dados atuais - use com cuidado</li>
                <li>• Backups antigos são removidos automaticamente conforme configuração de retenção</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`mr-2 h-5 w-5 ${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Description */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            <span>Sistema de Backup v1.0</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Última verificação: {new Date().toLocaleTimeString('pt-BR')}</span>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Sistema Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupSection;