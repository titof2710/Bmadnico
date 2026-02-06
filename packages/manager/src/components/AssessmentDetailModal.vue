<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h2>Assessment Details</h2>
        <button @click="closeModal" class="btn-close">✕</button>
      </div>

      <div v-if="loading" class="modal-body loading">
        <div class="spinner"></div>
        <p>Loading assessment details...</p>
      </div>

      <div v-else-if="error" class="modal-body error">
        <p>{{ error }}</p>
        <button @click="loadDetails" class="btn-retry">Retry</button>
      </div>

      <div v-else class="modal-body">
        <!-- Assessment Info -->
        <div class="section">
          <h3>General Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Session ID:</span>
              <span class="value">{{ assessment.sessionId }}</span>
            </div>
            <div class="info-item">
              <span class="label">Participant Email:</span>
              <span class="value">{{ assessment.participantEmail }}</span>
            </div>
            <div class="info-item">
              <span class="label">Template:</span>
              <span class="value">{{ assessment.templateId }}</span>
            </div>
            <div class="info-item">
              <span class="label">Status:</span>
              <span class="badge" :class="`badge-${assessment.status}`">
                {{ assessment.status }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Progress:</span>
              <span class="value">{{ assessment.currentPage }} / {{ assessment.totalPages }} pages</span>
            </div>
            <div class="info-item">
              <span class="label">Created:</span>
              <span class="value">{{ formatDate(assessment.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Started:</span>
              <span class="value">{{ formatDate(assessment.startedAt) || 'Not started' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Completed:</span>
              <span class="value">{{ formatDate(assessment.completedAt) || 'Not completed' }}</span>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="section">
          <h3>Completion Progress</h3>
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <p class="progress-text">{{ progressPercentage }}% Complete</p>
        </div>

        <!-- Event History -->
        <div class="section">
          <h3>Event History</h3>
          <div class="event-timeline">
            <div v-for="event in events" :key="event.eventId" class="event-item">
              <div class="event-marker"></div>
              <div class="event-content">
                <div class="event-header">
                  <span class="event-type">{{ event.eventType }}</span>
                  <span class="event-time">{{ formatDateTime(event.timestamp) }}</span>
                </div>
                <div class="event-details">
                  <pre>{{ JSON.stringify(event.payload, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="section">
          <h3>Actions</h3>
          <div class="actions-grid">
            <button
              v-if="assessment.status === 'completed'"
              @click="downloadPDF"
              class="btn btn-primary"
            >
              📥 Download PDF Report
            </button>
            <button
              v-if="assessment.status === 'active'"
              @click="suspendSession"
              class="btn btn-warning"
            >
              ⏸️ Suspend Session
            </button>
            <button
              v-if="assessment.status === 'active' || assessment.status === 'pending'"
              @click="expireSession"
              class="btn btn-danger"
            >
              🚫 Expire Session
            </button>
            <button @click="viewResults" class="btn btn-secondary">
              📊 View Results
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  show: boolean;
  sessionId: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'refresh']);

const assessment = ref<any>({});
const events = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const progressPercentage = computed(() => {
  if (!assessment.value.totalPages) return 0;
  return Math.round((assessment.value.currentPage / assessment.value.totalPages) * 100);
});

watch(() => props.show, (newVal) => {
  if (newVal && props.sessionId) {
    loadDetails();
  }
});

const loadDetails = async () => {
  if (!props.sessionId) return;

  loading.value = true;
  error.value = null;

  try {
    // Load assessment details
    const sessionResponse = await fetch(`http://localhost:3000/api/sessions?sessionId=${props.sessionId}`);
    if (!sessionResponse.ok) throw new Error('Failed to load session');
    const sessionData = await sessionResponse.json();
    assessment.value = sessionData.sessions[0];

    // Load event history
    const eventsResponse = await fetch(`http://localhost:3000/api/admin/audit-logs?sessionId=${props.sessionId}`);
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      events.value = eventsData.logs || [];
    }
  } catch (err: any) {
    console.error('Failed to load assessment details:', err);
    error.value = err.message || 'Failed to load details';
  } finally {
    loading.value = false;
  }
};

const downloadPDF = async () => {
  try {
    window.open(`http://localhost:3000/api/sessions/${props.sessionId}/pdf`, '_blank');
  } catch (err) {
    console.error('Failed to download PDF:', err);
    alert('Failed to download PDF report');
  }
};

const suspendSession = async () => {
  if (!confirm('Are you sure you want to suspend this session?')) return;

  try {
    const response = await fetch(`http://localhost:3000/api/sessions/${props.sessionId}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Suspended by admin' }),
    });

    if (!response.ok) throw new Error('Failed to suspend');

    alert('Session suspended successfully');
    emit('refresh');
    closeModal();
  } catch (err) {
    console.error('Failed to suspend session:', err);
    alert('Failed to suspend session');
  }
};

const expireSession = async () => {
  if (!confirm('Are you sure you want to expire this session?')) return;

  try {
    const response = await fetch(`http://localhost:3000/api/sessions/expire-old`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionIds: [props.sessionId] }),
    });

    if (!response.ok) throw new Error('Failed to expire');

    alert('Session expired successfully');
    emit('refresh');
    closeModal();
  } catch (err) {
    console.error('Failed to expire session:', err);
    alert('Failed to expire session');
  }
};

const viewResults = () => {
  window.open(`/results/${props.sessionId}`, '_blank');
};

const closeModal = () => {
  emit('close');
};

const formatDate = (date: string | Date | null) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString();
};

const formatDateTime = (date: string | Date) => {
  return new Date(date).toLocaleString();
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.25rem;
  color: #6b7280;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e5e7eb;
  color: #111827;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-body.loading,
.modal-body.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.section {
  margin-bottom: 32px;
}

.section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.value {
  font-size: 1rem;
  color: #111827;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  width: fit-content;
}

.badge-pending { background: #fef3c7; color: #92400e; }
.badge-active { background: #dbeafe; color: #1e40af; }
.badge-completed { background: #d1fae5; color: #065f46; }
.badge-expired { background: #fee2e2; color: #991b1b; }
.badge-suspended { background: #f3f4f6; color: #374151; }

.progress-bar-container {
  width: 100%;
  height: 24px;
  background: #f3f4f6;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.event-timeline {
  position: relative;
  padding-left: 32px;
}

.event-timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.event-item {
  position: relative;
  margin-bottom: 24px;
}

.event-marker {
  position: absolute;
  left: -28px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b82f6;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #3b82f6;
}

.event-content {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-type {
  font-weight: 600;
  color: #111827;
}

.event-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.event-details pre {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-retry {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

@media (max-width: 768px) {
  .modal-container {
    max-height: 95vh;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
