<template>
  <div class="kpis-container">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading KPIs...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchKPIs" class="btn-retry">Retry</button>
    </div>

    <div v-else class="kpis-grid">
      <KPICard
        title="Assessments Actifs"
        :value="kpis.activeAssessments"
        icon="play"
        color="blue"
        :subtitle="`${kpis.startedToday || 0} démarrés aujourd'hui`"
        trend="+18%"
        :sparkline-data="[8, 12, 15, 11, 14, 18, 22, 19, 24, 21]"
        :animation-delay="0"
      />

      <KPICard
        title="Assessments En Attente"
        :value="kpis.pendingAssessments"
        icon="clock"
        color="orange"
        :subtitle="`${kpis.awaitingLicense || 0} en attente de licences`"
        trend="-8%"
        :sparkline-data="[15, 18, 14, 12, 10, 11, 9, 8, 7, 6]"
        :animation-delay="100"
      />

      <KPICard
        title="Assessments Terminés"
        :value="kpis.completedAssessments"
        icon="check"
        color="green"
        :subtitle="`${kpis.completedThisMonth || 0} ce mois-ci`"
        trend="+24%"
        :sparkline-data="[45, 52, 58, 61, 65, 72, 78, 84, 89, 95]"
        :animation-delay="200"
      />

      <KPICard
        title="Revenu Total"
        :value="formatCurrency(kpis.totalRevenue || 0)"
        icon="dollar"
        color="purple"
        :subtitle="`${formatCurrency(kpis.revenueThisMonth || 0)} ce mois-ci`"
        trend="+32%"
        :sparkline-data="[5000, 6200, 7100, 8500, 9200, 10500, 11800, 13200, 14500, 15800]"
        :animation-delay="300"
      />
    </div>

    <button @click="fetchKPIs" class="btn-refresh" title="Refresh KPIs">
      🔄
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import KPICard from './KPICard.vue';

interface KPIs {
  activeAssessments: number;
  pendingAssessments: number;
  completedAssessments: number;
  totalRevenue: number;
  startedToday: number;
  awaitingLicense: number;
  completedThisMonth: number;
  revenueThisMonth: number;
}

const kpis = ref<KPIs>({
  activeAssessments: 0,
  pendingAssessments: 0,
  completedAssessments: 0,
  totalRevenue: 0,
  startedToday: 0,
  awaitingLicense: 0,
  completedThisMonth: 0,
  revenueThisMonth: 0,
});

const loading = ref(false);
const error = ref<string | null>(null);

const fetchKPIs = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch('http://localhost:3000/api/admin/kpis');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    kpis.value = data.kpis || data;
  } catch (err: any) {
    console.error('Failed to fetch KPIs:', err);
    error.value = err.message || 'Failed to load KPIs';
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

onMounted(() => {
  fetchKPIs();
  // Auto-refresh every 30 seconds
  setInterval(fetchKPIs, 30000);
});
</script>

<style scoped>
.kpis-container {
  position: relative;
  margin-bottom: 32px;
}

.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

/* Staggered animation for cards */
.kpis-grid > :nth-child(1) {
  animation-delay: 0ms;
}

.kpis-grid > :nth-child(2) {
  animation-delay: 100ms;
}

.kpis-grid > :nth-child(3) {
  animation-delay: 200ms;
}

.kpis-grid > :nth-child(4) {
  animation-delay: 300ms;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.error-state p {
  color: #ef4444;
  margin-bottom: 16px;
}

.btn-retry {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: #2563eb;
}

.btn-refresh {
  position: absolute;
  top: 0;
  right: 0;
  width: 40px;
  height: 40px;
  border: none;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-refresh:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-refresh:active {
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .kpis-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
