import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  createdAt: number;
}

export const useNotificationStore = defineStore('notifications', () => {
  const toasts = ref<Toast[]>([]);

  function addToast(toast: Omit<Toast, 'id' | 'createdAt'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      createdAt: Date.now(),
      duration: toast.duration ?? 5000,
    };

    toasts.value.push(newToast);

    // Auto-dismiss
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  }

  function success(title: string, message?: string, duration?: number) {
    return addToast({ type: 'success', title, message, duration });
  }

  function error(title: string, message?: string, duration?: number) {
    return addToast({ type: 'error', title, message, duration });
  }

  function info(title: string, message?: string, duration?: number) {
    return addToast({ type: 'info', title, message, duration });
  }

  function warning(title: string, message?: string, duration?: number) {
    return addToast({ type: 'warning', title, message, duration });
  }

  function clear() {
    toasts.value = [];
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
    clear,
  };
});
