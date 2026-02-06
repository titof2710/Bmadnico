<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in notificationStore.toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
        @click="notificationStore.removeToast(toast.id)"
      >
        <div class="toast-icon">
          <span v-if="toast.type === 'success'">✓</span>
          <span v-else-if="toast.type === 'error'">✕</span>
          <span v-else-if="toast.type === 'warning'">⚠</span>
          <span v-else>ℹ</span>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div v-if="toast.message" class="toast-message">{{ toast.message }}</div>
        </div>
        <button
          class="toast-close"
          @click.stop="notificationStore.removeToast(toast.id)"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useNotificationStore } from '../stores/notifications';

const notificationStore = useNotificationStore();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 420px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;
  cursor: pointer;
  pointer-events: all;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 320px;
}

.toast:hover {
  transform: translateX(-4px);
  box-shadow: 0 6px 32px rgba(0, 0, 0, 0.2);
}

.toast--success {
  border-left-color: #22c55e;
}

.toast--error {
  border-left-color: #ef4444;
}

.toast--warning {
  border-left-color: #f59e0b;
}

.toast--info {
  border-left-color: #3b82f6;
}

.toast-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

.toast--success .toast-icon {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.toast--error .toast-icon {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.toast--warning .toast-icon {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.toast--info .toast-icon {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 0.938rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.toast-message {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.toast-close {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  font-size: 1.125rem;
}

.toast-close:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Animations */
.toast-enter-active {
  animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-leave-active {
  animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

@media (max-width: 640px) {
  .toast-container {
    left: 20px;
    right: 20px;
    max-width: none;
  }

  .toast {
    min-width: auto;
  }
}
</style>
