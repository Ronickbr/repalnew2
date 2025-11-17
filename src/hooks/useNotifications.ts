import { useState, useCallback } from 'react';
import { NotificationProps } from '../components/admin/Notification';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = useCallback((type: NotificationProps['type'], message: string, title?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification: NotificationProps = {
      id,
      type,
      title: title || (type === 'error' ? 'Erro' : type === 'success' ? 'Sucesso' : type === 'warning' ? 'Aviso' : 'Informação'),
      message,
      duration: 5000,
      position: 'top-right'
    };
    
    setNotifications(prev => [...prev, notification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
  };
};