<template>
  <div class="chart-container">
    <div class="chart-header">
      <h2>Revenue Trend</h2>
      <span class="chart-subtitle">Last 12 months</span>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading revenue data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchRevenueTrend" class="btn-retry">Retry</button>
    </div>

    <div v-else class="chart-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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

interface MonthRevenue {
  month: string;
  revenue: number;
  orders: number;
}

const revenueData = ref<MonthRevenue[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const chartData = computed(() => ({
  labels: revenueData.value.map(d => d.month),
  datasets: [
    {
      label: 'Revenue ($)',
      data: revenueData.value.map(d => d.revenue),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#3b82f6',
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
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      callbacks: {
        label: (context: any) => {
          const dataIndex = context.dataIndex;
          const revenue = revenueData.value[dataIndex].revenue;
          const orders = revenueData.value[dataIndex].orders;
          return [
            `Revenue: $${revenue.toLocaleString()}`,
            `Orders: ${orders}`,
          ];
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: any) => `$${value.toLocaleString()}`,
      },
    },
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false,
  },
}));

const fetchRevenueTrend = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch('http://localhost:3000/api/admin/revenue-trend');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    revenueData.value = data.trend || [];
  } catch (err: any) {
    console.error('Failed to fetch revenue trend:', err);
    error.value = err.message || 'Failed to load revenue trend';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchRevenueTrend();
});
</script>

<style scoped>
.chart-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.chart-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.chart-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

.chart-wrapper {
  position: relative;
  height: 400px;
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
  transition: background 0.2s;
}

.btn-retry:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .chart-container {
    padding: 16px;
  }

  .chart-wrapper {
    height: 300px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
