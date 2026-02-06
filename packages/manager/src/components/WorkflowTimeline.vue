<template>
  <div class="workflow-timeline">
    <h3 class="timeline-title">Historique de la Session</h3>

    <div class="timeline-container">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="timeline-step"
        :class="{
          'step-completed': step.status === 'completed',
          'step-current': step.status === 'current',
          'step-pending': step.status === 'pending',
        }"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <!-- Icon -->
        <div class="step-icon-wrapper">
          <div class="step-icon">
            <span v-if="step.status === 'completed'">✓</span>
            <span v-else-if="step.status === 'current'" class="pulse-dot"></span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div v-if="index < steps.length - 1" class="step-connector"></div>
        </div>

        <!-- Content -->
        <div class="step-content">
          <div class="step-header">
            <h4 class="step-title">{{ step.title }}</h4>
            <span v-if="step.timestamp" class="step-timestamp">
              {{ formatTimestamp(step.timestamp) }}
            </span>
          </div>

          <p v-if="step.description" class="step-description">
            {{ step.description }}
          </p>

          <!-- Duration badge -->
          <div v-if="step.duration" class="step-duration">
            <span class="duration-icon">⏱️</span>
            <span>{{ step.duration }}</span>
          </div>

          <!-- Metadata -->
          <div v-if="step.metadata" class="step-metadata">
            <div
              v-for="(value, key) in step.metadata"
              :key="key"
              class="metadata-item"
            >
              <span class="metadata-key">{{ key }}:</span>
              <span class="metadata-value">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface StepMetadata {
  [key: string]: string | number;
}

interface TimelineStep {
  title: string;
  description?: string;
  timestamp?: Date | string;
  duration?: string;
  status: 'completed' | 'current' | 'pending';
  metadata?: StepMetadata;
}

interface Props {
  steps: TimelineStep[];
}

defineProps<Props>();

const formatTimestamp = (timestamp: Date | string) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
</script>

<style scoped>
.workflow-timeline {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timeline-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 32px 0;
}

.timeline-container {
  position: relative;
}

.timeline-step {
  display: flex;
  gap: 20px;
  animation: slideInLeft 0.5s ease-out backwards;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.timeline-step:not(:last-child) {
  margin-bottom: 32px;
}

.step-icon-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.step-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
  background: #e5e7eb;
  color: #6b7280;
  transition: all 0.3s ease;
  z-index: 1;
}

.step-completed .step-icon {
  background: #22c55e;
  color: white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.step-current .step-icon {
  background: #3b82f6;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.6);
  }
}

.pulse-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  animation: pulseDot 1.5s ease-in-out infinite;
}

@keyframes pulseDot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

.step-connector {
  width: 2px;
  flex: 1;
  background: #e5e7eb;
  margin-top: 8px;
  position: relative;
}

.step-completed + .timeline-step .step-connector::before,
.step-completed .step-connector {
  background: #22c55e;
}

.step-completed .step-connector::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, transparent, #22c55e);
  animation: fillConnector 0.6s ease-out;
}

@keyframes fillConnector {
  from {
    height: 0;
  }
  to {
    height: 100%;
  }
}

.step-content {
  flex: 1;
  padding-bottom: 8px;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 8px;
}

.step-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.step-current .step-title {
  color: #3b82f6;
}

.step-timestamp {
  font-size: 0.875rem;
  color: #6b7280;
  white-space: nowrap;
}

.step-description {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.step-duration {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: #f3f4f6;
  border-radius: 12px;
  font-size: 0.813rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 12px;
}

.duration-icon {
  font-size: 1rem;
}

.step-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.metadata-item {
  font-size: 0.813rem;
  padding: 6px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.metadata-key {
  font-weight: 600;
  color: #6b7280;
  margin-right: 4px;
}

.metadata-value {
  color: #111827;
}

@media (max-width: 640px) {
  .workflow-timeline {
    padding: 16px;
  }

  .timeline-step {
    gap: 12px;
  }

  .step-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .step-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .step-title {
    font-size: 1rem;
  }

  .step-timestamp {
    font-size: 0.75rem;
  }

  .step-metadata {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
