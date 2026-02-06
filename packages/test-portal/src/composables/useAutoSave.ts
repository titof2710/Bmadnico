/**
 * Auto-save Composable
 * Automatically saves responses every 30 seconds
 */

import { ref, watch, onUnmounted } from 'vue';
import { apiService } from '../services/api';

export function useAutoSave(sessionToken: string, pageId: string) {
  const saveQueue = ref<Map<string, unknown>>(new Map());
  const isSaving = ref(false);
  const lastSaved = ref<Date | null>(null);
  const saveError = ref<string | null>(null);

  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const queueResponse = (questionId: string, responseValue: unknown) => {
    saveQueue.value.set(questionId, responseValue);
    scheduleSave();
  };

  const scheduleSave = () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    // Save after 30 seconds of inactivity
    saveTimer = setTimeout(() => {
      flushQueue();
    }, 30000);
  };

  const flushQueue = async () => {
    if (saveQueue.value.size === 0 || isSaving.value) {
      return;
    }

    isSaving.value = true;
    saveError.value = null;

    try {
      const responses = Array.from(saveQueue.value.entries());

      for (const [questionId, responseValue] of responses) {
        await apiService.submitResponse(sessionToken, {
          questionId,
          pageId,
          responseValue,
        });
      }

      saveQueue.value.clear();
      lastSaved.value = new Date();
    } catch (error) {
      console.error('Auto-save error:', error);
      saveError.value = 'Failed to save responses';
    } finally {
      isSaving.value = false;
    }
  };

  const saveImmediately = async () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    await flushQueue();
  };

  // Cleanup
  onUnmounted(() => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    // Final save before unmount
    if (saveQueue.value.size > 0) {
      flushQueue();
    }
  });

  return {
    queueResponse,
    saveImmediately,
    isSaving,
    lastSaved,
    saveError,
    pendingCount: () => saveQueue.value.size,
  };
}
