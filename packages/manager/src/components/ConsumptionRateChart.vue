<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>Taux de Consommation des Licences</h3>
      <div class="chart-controls">
        <select v-model="selectedPeriod" class="period-select">
          <option value="7">7 derniers jours</option>
          <option value="14">14 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
        <button @click="fetchData" class="btn-refresh" title="Rafraîchir">
          🔄
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Chargement des données de consommation...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchData" class="btn-retry">Réessayer</button>
    </div>

    <div v-else class="chart-wrapper">
      <div class="chart-stats">
        <div class="stat-card">
          <span class="stat-label">Total Consommé</span>
          <span class="stat-value stat-value--primary">{{ totalConsumed }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Moy. par Jour</span>
          <span class="stat-value">{{ averagePerDay }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Pic Jour</span>
          <span class="stat-value stat-value--success">{{ peakDay }}</span>
        </div>
      </div>

      <div class="chart-canvas">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ConsumptionData {
  date: string;
  consumed: number;
  released: number;
  netChange: number;
}

interface Props {
  poolId?: string;
  organizationId?: string;
}

const props = defineProps<Props>();

const consumptionData = ref<ConsumptionData[]>([]);
const selectedPeriod = ref(30);
const loading = ref(false);
const error = ref<string | null>(null);

const totalConsumed = computed(() => {
  return consumptionData.value.reduce((sum, d) => sum + d.consumed, 0);
});

const averagePerDay = computed(() => {
  if (consumptionData.value.length === 0) return 0;
  return Math.round(totalConsumed.value / consumptionData.value.length);
});

const peakDay = computed(() => {
  if (consumptionData.value.length === 0) return 0;
  return Math.max(...consumptionData.value.map(d => d.consumed));
});

const chartData = computed(() => ({
  labels: consumptionData.value.map(d => formatChartDate(d.date)),
  datasets: [
    {
      label: 'Licences Consommées',
      data: consumptionData.value.map(d => d.consumed),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
    },
    {
      label: 'Licences Libérées',
      data: consumptionData.value.map(d => d.released),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 16,
        font: {
          size: 12,
          weight: 500,
        },
      },
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#374151',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: (context: any) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          return `${label}: ${value} licences`;
        },
        afterBody: (tooltipItems: any) => {
          const dataIndex = tooltipItems[0].dataIndex;
          const netChange = consumptionData.value[dataIndex].netChange;
          const sign = netChange >= 0 ? '+' : '';
          return `Changement Net: ${sign}${netChange}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 11,
        },
        maxRotation: 45,
        minRotation: 0,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: {
          size: 11,
        },
        callback: (value: any) => `${value}`,
      },
    },
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false,
  },
}));

const formatChartDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    month: 'short',
    day: 'numeric',
  });
};

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const fetchData = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (props.poolId) params.append('poolId', props.poolId);
    if (props.organizationId) params.append('organizationId', props.organizationId);
    params.append('days', selectedPeriod.value.toString());

    const response = await fetch(
      `${API_URL}/api/admin/license-consumption?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // If API doesn't exist yet, generate mock data for demo
    if (response.status === 404) {
      consumptionData.value = generateMockData(selectedPeriod.value);
    } else {
      consumptionData.value = data.consumption || [];
    }
  } catch (err: any) {
    console.error('Failed to fetch consumption data:', err);

    // Generate mock data for demo purposes
    if (err.message.includes('404')) {
      consumptionData.value = generateMockData(selectedPeriod.value);
    } else {
      error.value = err.message || 'Échec du chargement des données de consommation';
    }
  } finally {
    loading.value = false;
  }
};

const generateMockData = (days: number): ConsumptionData[] => {
  const data: ConsumptionData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const consumed = Math.floor(Math.random() * 10) + 2; // 2-12
    const released = Math.floor(Math.random() * 5); // 0-5

    data.push({
      date: date.toISOString().split('T')[0],
      consumed,
      released,
      netChange: consumed - released,
    });
  }

  return data;
};

watch(() => selectedPeriod.value, () => {
  fetchData();
});

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.chart-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.chart-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.chart-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.period-select {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.period-select:hover {
  border-color: #3b82f6;
}

.period-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-refresh {
  width: 40px;
  height: 40px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
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
}

.chart-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.stat-value--primary {
  color: #3b82f6;
}

.stat-value--success {
  color: #10b981;
}

.chart-canvas {
  position: relative;
  height: 350px;
}

@media (max-width: 768px) {
  .chart-container {
    padding: 16px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .chart-controls {
    width: 100%;
    justify-content: space-between;
  }

  .period-select {
    flex: 1;
  }

  .chart-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .chart-canvas {
    height: 250px;
  }
}
</style>
