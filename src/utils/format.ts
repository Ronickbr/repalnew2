// Função para formatar bytes em formato legível
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Função para formatar data em formato brasileiro
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Nunca';

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Data inválida';

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Função para formatar data apenas (sem hora)
export const formatDateOnly = (dateString: string | null): string => {
  if (!dateString) return 'Nunca';

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Data inválida';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Função para formatar hora apenas
export const formatTimeOnly = (dateString: string | null): string => {
  if (!dateString) return '--:--';

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return '--:--';

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Função para formatar duração em milissegundos
export const formatDuration = (startDate: string | null, endDate: string | null): string => {
  if (!startDate || !endDate) return '--';

  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '--';

  const durationMs = end.getTime() - start.getTime();
  
  if (durationMs < 0) return '--';

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// Função para formatar tempo relativo (ex: "há 2 horas")
export const formatRelativeTime = (dateString: string | null): string => {
  if (!dateString) return 'Nunca';

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Data inválida';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (diffMs < 0) return 'No futuro';

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    return `há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
  } else {
    return 'agora mesmo';
  }
};

// Função para formatar status com cores
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'running':
      return 'text-blue-600 bg-blue-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'failed':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// Função para formatar status em português
export const formatStatus = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'Concluído';
    case 'running':
      return 'Executando';
    case 'pending':
      return 'Pendente';
    case 'failed':
      return 'Falhou';
    default:
      return status;
  }
};









// Função para formatar porcentagem
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

// Função para formatar número com separadores de milhares
export const formatNumber = (value: number): string => {
  return value.toLocaleString('pt-BR');
};