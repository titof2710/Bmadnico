<template>
  <div class="min-h-screen bg-gray-50">
    <!-- État de Chargement -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Chargement de l'évaluation...</p>
      </div>
    </div>

    <!-- État d'Erreur -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="bg-white p-8 rounded-lg shadow-lg max-w-md">
        <div class="text-red-600 text-5xl mb-4">⚠️</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Erreur de Session</h2>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <button
          @click="retryLoad"
          class="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Réessayer
        </button>
      </div>
    </div>

    <!-- Écran de Démarrage -->
    <div
      v-else-if="sessionData && sessionData.session.status === 'pending'"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="bg-white p-8 rounded-lg shadow-lg max-w-2xl">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          {{ sessionData.template.name }}
        </h1>
        <p class="text-gray-600 mb-6">{{ sessionData.template.description }}</p>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 class="font-semibold text-blue-900 mb-2">📋 Informations sur l'Évaluation</h3>
          <ul class="text-sm text-blue-800 space-y-1">
            <li>• Nombre de pages : {{ sessionData.session.totalPages }}</li>
            <li>• Durée estimée : {{ sessionData.session.totalPages * 3 }} minutes</li>
            <li>• Sauvegarde automatique : Toutes les 30 secondes</li>
            <li>• Vous pouvez reprendre sur n'importe quel appareil</li>
          </ul>
        </div>

        <button
          @click="startSession"
          :disabled="starting"
          class="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 text-lg font-semibold"
        >
          {{ starting ? 'Démarrage...' : 'Commencer l\'Évaluation' }}
        </button>
      </div>
    </div>

    <!-- Questions de l'Évaluation -->
    <div v-else-if="sessionData && sessionData.session.status === 'active'" class="max-w-4xl mx-auto py-8 px-4">
      <!-- En-tête -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ sessionData.template.name }}
          </h1>
          <div class="text-sm text-gray-500">
            Page {{ sessionData.session.currentPage }} sur {{ sessionData.session.totalPages }}
          </div>
        </div>

        <!-- Barre de Progression -->
        <div class="progress-bar-container">
          <div
            class="progress-bar-fill"
            :class="getProgressColorClass(sessionData.session.progress)"
            :style="{ width: `${sessionData.session.progress}%` }"
          ></div>
        </div>
      </div>

      <!-- Page Actuelle -->
      <Transition name="page-slide" mode="out-in">
        <div v-if="sessionData.currentPageData" :key="sessionData.currentPageData.id" class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-xl font-bold text-gray-900 mb-2">
            {{ sessionData.currentPageData.title }}
          </h2>
          <p v-if="sessionData.currentPageData.description" class="text-gray-600 mb-6">
            {{ sessionData.currentPageData.description }}
          </p>

        <!-- Questions -->
        <div class="space-y-8">
          <div
            v-for="question in sessionData.currentPageData.questions"
            :key="question.id"
            class="border-b border-gray-200 pb-6 last:border-0"
          >
            <label class="block text-gray-900 font-medium mb-3">
              {{ question.text }}
              <span v-if="question.required" class="text-red-500">*</span>
            </label>

            <!-- Choix Unique -->
            <div v-if="question.type === 'single_choice'" class="space-y-2">
              <label
                v-for="option in question.options"
                :key="option.id"
                class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                :class="{ 'border-primary-500 bg-primary-50': responses[question.id] === option.value }"
              >
                <input
                  type="radio"
                  :name="question.id"
                  :value="option.value"
                  v-model="responses[question.id]"
                  @change="handleResponse(question.id, option.value)"
                  class="mr-3"
                />
                {{ option.text }}
              </label>
            </div>

            <!-- Choix Multiples -->
            <div v-else-if="question.type === 'multiple_choice'" class="space-y-2">
              <label
                v-for="option in question.options"
                :key="option.id"
                class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  :value="option.id"
                  v-model="multipleChoices[question.id]"
                  @change="handleMultipleChoice(question.id)"
                  class="mr-3"
                />
                {{ option.text }}
              </label>
            </div>

            <!-- Échelle -->
            <div v-else-if="question.type === 'scale'" class="space-y-2">
              <input
                type="range"
                :min="question.scaleMin"
                :max="question.scaleMax"
                v-model="responses[question.id]"
                @input="handleResponse(question.id, responses[question.id])"
                class="w-full"
              />
              <div class="flex justify-between text-sm text-gray-600">
                <span>{{ question.scaleMin }}</span>
                <span class="font-semibold text-primary-600">{{ responses[question.id] || question.scaleMin }}</span>
                <span>{{ question.scaleMax }}</span>
              </div>
            </div>

            <!-- Texte -->
            <div v-else-if="question.type === 'text'">
              <textarea
                v-model="responses[question.id]"
                @input="handleResponse(question.id, responses[question.id])"
                rows="4"
                class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Entrez votre réponse..."
              ></textarea>
            </div>
          </div>
        </div>
        </div>
      </Transition>

      <!-- Actions du Pied de Page -->
      <div class="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center">
        <div class="auto-save-indicator">
          <Transition name="fade" mode="out-in">
            <div v-if="autoSave.isSaving.value" key="saving" class="save-status save-status--saving">
              <span class="save-icon saving-spinner">💾</span>
              <span class="save-text">Sauvegarde en cours...</span>
            </div>
            <div v-else-if="autoSave.lastSaved.value" key="saved" class="save-status save-status--saved">
              <span class="save-icon saved-check">✓</span>
              <span class="save-text">Sauvegardé à {{ formatTime(autoSave.lastSaved.value) }}</span>
            </div>
            <div v-else-if="autoSave.pendingCount() > 0" key="pending" class="save-status save-status--pending">
              <span class="save-icon">⏳</span>
              <span class="save-text">{{ autoSave.pendingCount() }} non sauvegardé(s)</span>
            </div>
          </Transition>
        </div>

        <button
          @click="nextPage"
          :disabled="!canProceed"
          class="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {{ sessionData.session.currentPage === sessionData.session.totalPages ? 'Terminer' : 'Page Suivante' }}
        </button>
      </div>
    </div>

    <!-- État Terminé -->
    <div
      v-else-if="sessionData && sessionData.session.status === 'completed'"
      class="flex items-center justify-center min-h-screen completion-screen"
    >
      <div class="completion-card">
        <div class="success-icon-wrapper">
          <div class="success-icon">✓</div>
          <div class="success-ring"></div>
        </div>

        <h2 class="completion-title">Évaluation Terminée !</h2>
        <p class="completion-subtitle">
          Félicitations pour avoir complété cette évaluation.
        </p>

        <div class="completion-stats">
          <div class="stat-item">
            <div class="stat-value">{{ sessionData.session.totalPages }}</div>
            <div class="stat-label">Pages complétées</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">100%</div>
            <div class="stat-label">Progression</div>
          </div>
        </div>

        <div class="completion-message">
          <p>✨ Vos réponses ont été enregistrées avec succès.</p>
          <p class="text-sm mt-2">Vous pouvez maintenant fermer cette fenêtre.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { apiService, type SessionData, type Question } from '../services/api';
import { useAutoSave } from '../composables/useAutoSave';
import confetti from 'canvas-confetti';

const route = useRoute();
const sessionToken = ref(route.params.token as string);

const loading = ref(true);
const error = ref<string | null>(null);
const sessionData = ref<SessionData | null>(null);
const starting = ref(false);

const responses = reactive<Record<string, any>>({});
const multipleChoices = reactive<Record<string, string[]>>({});

const autoSave = useAutoSave(
  sessionToken.value,
  computed(() => sessionData.value?.currentPageData?.id || '').value
);

const canProceed = computed(() => {
  if (!sessionData.value?.currentPageData) return false;

  const requiredQuestions = sessionData.value.currentPageData.questions.filter(q => q.required);
  return requiredQuestions.every(q => responses[q.id] !== undefined && responses[q.id] !== '');
});

async function loadSession() {
  try {
    loading.value = true;
    error.value = null;
    sessionData.value = await apiService.getSession(sessionToken.value);

    // Initialiser les tableaux pour les questions à choix multiples
    if (sessionData.value?.currentPageData?.questions) {
      sessionData.value.currentPageData.questions.forEach(question => {
        if (question.type === 'multiple_choice') {
          if (!multipleChoices[question.id]) {
            multipleChoices[question.id] = [];
          }
        }
      });
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Échec du chargement de la session';
  } finally {
    loading.value = false;
  }
}

async function startSession() {
  try {
    starting.value = true;
    const device = /mobile|android|iphone|ipad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    await apiService.startSession(sessionToken.value, device, navigator.userAgent);
    await loadSession();
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Échec du démarrage de la session';
  } finally {
    starting.value = false;
  }
}

function handleResponse(questionId: string, value: unknown) {
  autoSave.queueResponse(questionId, value);
}

function handleMultipleChoice(questionId: string) {
  const selected = multipleChoices[questionId] || [];
  autoSave.queueResponse(questionId, selected);
}

async function nextPage() {
  if (!sessionData.value?.currentPageData) return;

  // Sauvegarder immédiatement avant de continuer
  await autoSave.saveImmediately();

  // Marquer la page comme complète
  await apiService.completePage(sessionToken.value, sessionData.value.currentPageData.id);

  // Vider les réponses AVANT de recharger la page suivante
  Object.keys(responses).forEach(key => delete responses[key]);
  Object.keys(multipleChoices).forEach(key => delete multipleChoices[key]);

  // Recharger la session (qui réinitialisera les tableaux pour la nouvelle page)
  await loadSession();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function retryLoad() {
  loadSession();
}

function getProgressColorClass(progress: number): string {
  if (progress < 25) return 'progress-bar-fill--start';
  if (progress < 50) return 'progress-bar-fill--low';
  if (progress < 75) return 'progress-bar-fill--mid';
  return 'progress-bar-fill--high';
}

const triggerCelebration = () => {
  // Professional confetti effect - elegant, not excessive
  const count = 150;
  const defaults = {
    origin: { y: 0.6 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Two bursts for professional look
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#22c55e', '#3b82f6', '#a855f7'],
  });

  fire(0.2, {
    spread: 60,
    colors: ['#22c55e', '#3b82f6', '#a855f7'],
  });

  setTimeout(() => {
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#22c55e', '#3b82f6', '#a855f7'],
    });
  }, 100);

  setTimeout(() => {
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#22c55e', '#3b82f6', '#a855f7'],
    });
  }, 200);
};

// Watch for completion and trigger celebration
watch(() => sessionData.value?.session.status, (newStatus, oldStatus) => {
  if (newStatus === 'completed' && oldStatus !== 'completed') {
    setTimeout(() => triggerCelebration(), 300);
  }
});

onMounted(() => {
  loadSession();
});
</script>

<style scoped>
/* Page slide transition */
.page-slide-enter-active,
.page-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.page-slide-enter-to,
.page-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* Auto-save indicator */
.auto-save-indicator {
  display: flex;
  align-items: center;
  min-width: 200px;
}

.save-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.save-status--saving {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.save-status--saved {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.save-status--pending {
  background: rgba(251, 191, 36, 0.1);
  color: #f59e0b;
}

.save-icon {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.saving-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.saved-check {
  animation: checkmark 0.5s ease-out;
}

@keyframes checkmark {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-45deg);
  }
  50% {
    transform: scale(1.2) rotate(0deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

/* Fade transition for save status */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Progress bar with gradient */
.progress-bar-container {
  width: 100%;
  height: 10px;
  background: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1), background 0.5s ease;
  position: relative;
  overflow: hidden;
}

.progress-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  50%, 100% {
    left: 100%;
  }
}

.progress-bar-fill--start {
  background: linear-gradient(90deg, #ef4444, #f97316);
}

.progress-bar-fill--low {
  background: linear-gradient(90deg, #f97316, #f59e0b);
}

.progress-bar-fill--mid {
  background: linear-gradient(90deg, #f59e0b, #22c55e);
}

.progress-bar-fill--high {
  background: linear-gradient(90deg, #22c55e, #10b981);
}

/* Completion screen styles */
.completion-screen {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.completion-card {
  background: white;
  border-radius: 24px;
  padding: 48px 40px;
  max-width: 560px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.success-icon-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 32px;
}

.success-icon {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #22c55e 0%, #10b981 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  font-weight: 700;
  color: white;
  position: relative;
  z-index: 2;
  animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s backwards;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.success-ring {
  position: absolute;
  top: -12px;
  left: -12px;
  right: -12px;
  bottom: -12px;
  border: 4px solid #22c55e;
  border-radius: 50%;
  opacity: 0.3;
  animation: ripple 1.5s ease-out 0.5s infinite;
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

.completion-title {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 12px 0;
  animation: fadeIn 0.6s ease-out 0.6s backwards;
}

.completion-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0 0 32px 0;
  animation: fadeIn 0.6s ease-out 0.7s backwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.completion-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  padding: 24px;
  background: #f9fafb;
  border-radius: 16px;
  margin-bottom: 32px;
  animation: fadeIn 0.6s ease-out 0.8s backwards;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 48px;
  background: #e5e7eb;
}

.completion-message {
  padding: 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 12px;
  font-size: 1rem;
  color: #374151;
  line-height: 1.6;
  animation: fadeIn 0.6s ease-out 0.9s backwards;
}

.completion-message .text-sm {
  color: #6b7280;
}

@media (max-width: 640px) {
  .completion-card {
    padding: 32px 24px;
  }

  .success-icon-wrapper {
    width: 96px;
    height: 96px;
  }

  .success-icon {
    font-size: 3rem;
  }

  .completion-title {
    font-size: 1.75rem;
  }

  .completion-stats {
    gap: 16px;
    padding: 20px;
  }

  .stat-value {
    font-size: 2rem;
  }
}
</style>
