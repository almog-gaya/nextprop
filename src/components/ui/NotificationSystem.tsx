'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

interface NotificationContextProps {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

// Create context
const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

// Default notification durations
const DEFAULT_DURATIONS: Record<NotificationType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
};

// Provider component
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate a unique ID for each notification
  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add a notification
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || DEFAULT_DURATIONS[notification.type],
      dismissible: notification.dismissible !== false,
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Auto-remove notifications after their duration
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    notifications.forEach(notification => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
        
        timers.push(timer);
      }
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, clearAll }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

// Hook to use the notification system
export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return {
    ...context,
    success: (message: string, options = {}) => 
      context.addNotification({ type: 'success', message, ...options }),
    error: (message: string, options = {}) => 
      context.addNotification({ type: 'error', message, ...options }),
    warning: (message: string, options = {}) => 
      context.addNotification({ type: 'warning', message, ...options }),
    info: (message: string, options = {}) => 
      context.addNotification({ type: 'info', message, ...options }),
  };
}

// Container component that shows all notifications
function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 w-96 max-w-full">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

// Individual notification item
function NotificationItem({ 
  notification, 
  onClose 
}: { 
  notification: Notification; 
  onClose: () => void 
}) {
  const { id, type, message, dismissible } = notification;
  
  // CSS classes based on notification type
  const getTypeClasses = (): string => {
    switch (type) {
      case 'success':
        return 'bg-success-50 border-success-500 text-success-800';
      case 'error':
        return 'bg-error-50 border-error-500 text-error-800';
      case 'warning':
        return 'bg-warning-50 border-warning-500 text-warning-800';
      case 'info':
        return 'bg-info-50 border-info-500 text-info-800';
      default:
        return 'bg-neutral-50 border-neutral-500 text-neutral-800';
    }
  };
  
  // Icon based on notification type
  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-error-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-info-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`shadow-md rounded-lg border-l-4 p-4 flex items-start animate-fade-in ${getTypeClasses()}`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">
        {getTypeIcon()}
      </div>
      
      <div className="flex-1 mr-2">
        <p className="text-sm">{message}</p>
      </div>
      
      {dismissible && (
        <button
          className="flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

// CSS animation for the notification container
const fadeInAnimation = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
`;

// Inject animation styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = fadeInAnimation;
  document.head.appendChild(style);
} 