import React from 'react';
import { ToastContainer } from '../notifications/ToastNotification';
import { useToasts, useNotificationsStore } from '../../stores/notifications-store';

export const ToastProvider: React.FC = () => {
  const toasts = useToasts();
  const { removeToast } = useNotificationsStore();

  return (
    <ToastContainer
      toasts={toasts}
      onClose={removeToast}
      position="top-right"
    />
  );
};