import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for fade out
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  
  const typeClasses = {
    success: 'bg-[var(--color-success)] text-white',
    error: 'bg-[var(--color-error)] text-white',
    warning: 'bg-[var(--color-warning)] text-white',
    info: 'bg-[var(--color-info)] text-white',
  };
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
  };
  
  if (!isVisible) return null;
  
  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${typeClasses[type]} animate-slide-in-right max-w-sm`}
      role="alert"
      aria-live="assertive"
    >
      <i className={`fa-solid ${icons[type]} flex-shrink-0`} aria-hidden="true" />
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        className="flex-shrink-0 ml-2 hover:opacity-80 transition-opacity"
        aria-label="Close notification"
      >
        <i className="fa-solid fa-times" aria-hidden="true" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: ToastType }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: ToastType }>>([]);
  
  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  };
  
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };
  
  return { toasts, showToast, removeToast, ToastContainer };
};

export default Toast;

