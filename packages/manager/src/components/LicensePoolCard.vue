<template>
  <div class="license-pool-card" :class="`license-pool-card--${statusColor}`">
    <div class="card-header">
      <div class="card-title">
        <h3>{{ pool.templateId }}</h3>
        <span class="badge" :class="`badge-${statusColor}`">
          {{ statusText }}
        </span>
      </div>
      <div class="card-actions">
        <button
          @click="$emit('order', pool)"
          class="btn-icon btn-primary"
          title="Commander des licences"
        >
          🛒
        </button>
        <button
          @click="$emit('configure', pool)"
          class="btn-icon btn-secondary"
          title="Configurer les seuils"
        >
          ⚙️
        </button>
      </div>
    </div>

    <div class="card-body">
      <!-- License Stats -->
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Disponibles</span>
          <span class="stat-value stat-value--success">{{ pool.availableLicenses }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Consommées</span>
          <span class="stat-value stat-value--danger">{{ pool.consumedLicenses }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total</span>
          <span class="stat-value">{{ pool.totalLicenses }}</span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-section">
        <div class="progress-bar-container">
          <div
            class="progress-bar"
            :class="`progress-bar--${statusColor}`"
            :style="{ width: consumptionPercentage + '%' }"
          ></div>
        </div>
        <div class="progress-info">
          <span class="progress-text">{{ consumptionPercentage }}% consommées</span>
          <span class="progress-threshold">Seuil: {{ pool.warningThreshold || 75 }}%</span>
        </div>
      </div>

      <!-- Company Info -->
      <div class="info-section">
        <div class="info-item">
          <span class="info-label">🏢 Organisation:</span>
          <span class="info-value">{{ pool.organizationId }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">📅 Créé le:</span>
          <span class="info-value">{{ formatDate(pool.createdAt) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">🔄 Mis à jour:</span>
          <span class="info-value">{{ formatDate(pool.updatedAt) }}</span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <button
        @click="$emit('view-details', pool)"
        class="btn btn-block btn-secondary"
      >
        📊 Voir Détails & Historique
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface LicensePool {
  poolId: string;
  organizationId: string;
  templateId: string;
  totalLicenses: number;
  availableLicenses: number;
  consumedLicenses: number;
  warningThreshold: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

const props = defineProps<{
  pool: LicensePool;
}>();

defineEmits(['order', 'configure', 'view-details']);

const consumptionPercentage = computed(() => {
  if (!props.pool.totalLicenses || props.pool.totalLicenses === 0) return 0;
  const consumed = props.pool.consumedLicenses || 0;
  return Math.round((consumed / props.pool.totalLicenses) * 100);
});

const statusColor = computed(() => {
  const percentage = consumptionPercentage.value;
  const threshold = props.pool.warningThreshold || 75;

  if (percentage >= 90) return 'red';
  if (percentage >= threshold) return 'orange';
  return 'green';
});

const statusText = computed(() => {
  const available = props.pool.availableLicenses || 0;

  if (available === 0) return 'Rupture';
  if (consumptionPercentage.value >= 90) return 'Critique';
  const threshold = props.pool.warningThreshold || 75;
  if (consumptionPercentage.value >= threshold) return 'Alerte';
  return 'Sain';
});

const formatDate = (date: string | Date): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
</script>

<style scoped>
.license-pool-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  border-left: 4px solid;
}

.license-pool-card--green {
  border-left-color: #10b981;
}

.license-pool-card--orange {
  border-left-color: #f59e0b;
}

.license-pool-card--red {
  border-left-color: #ef4444;
}

.license-pool-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
  background: linear-gradient(to bottom, #f9fafb, #ffffff);
}

.card-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-title h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
}

.badge-green {
  background: #d1fae5;
  color: #065f46;
}

.badge-orange {
  background: #fed7aa;
  color: #92400e;
}

.badge-red {
  background: #fee2e2;
  color: #991b1b;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  transform: scale(1.1);
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

.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
}

.stat-value--success {
  color: #10b981;
}

.stat-value--danger {
  color: #ef4444;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar-container {
  width: 100%;
  height: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: fillProgress 1s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

@keyframes fillProgress {
  from {
    width: 0 !important;
  }
}

/* Shimmer effect overlay */
.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
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

.progress-bar--green {
  background: linear-gradient(90deg, #10b981, #059669);
}

.progress-bar--orange {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.progress-bar--red {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-text {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

.progress-threshold {
  font-size: 0.75rem;
  color: #6b7280;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.info-label {
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  color: #111827;
  font-weight: 600;
}

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid #f3f4f6;
  background: #f9fafb;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.875rem;
}

.btn-block {
  width: 100%;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
  }

  .card-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
