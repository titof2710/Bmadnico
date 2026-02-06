<template>
  <div class="status-chart-container">
    <h3 class="chart-title">Répartition des Assessments</h3>

    <div class="chart-wrapper">
      <!-- SVG Donut Chart -->
      <svg :width="size" :height="size" class="donut-chart">
        <g :transform="`translate(${size / 2}, ${size / 2})`">
          <!-- Background circle -->
          <circle
            :r="radius"
            fill="none"
            stroke="#f3f4f6"
            :stroke-width="strokeWidth"
          />

          <!-- Animated segments -->
          <circle
            v-for="(segment, index) in segments"
            :key="segment.status"
            :r="radius"
            fill="none"
            :stroke="segment.color"
            :stroke-width="strokeWidth"
            :stroke-dasharray="calculateDashArray(segment.percentage)"
            :stroke-dashoffset="calculateDashOffset(index)"
            class="donut-segment"
            :class="`segment-${index}`"
            :style="{ animationDelay: `${index * 150}ms` }"
            stroke-linecap="round"
            transform="rotate(-90)"
          />

          <!-- Center text -->
          <text
            text-anchor="middle"
            dy="0.3em"
            class="center-text"
          >
            <tspan x="0" dy="-0.5em" class="center-total">{{ total }}</tspan>
            <tspan x="0" dy="1.5em" class="center-label">Sessions</tspan>
          </text>
        </g>
      </svg>

      <!-- Legend -->
      <div class="chart-legend">
        <div
          v-for="(segment, index) in segments"
          :key="segment.status"
          class="legend-item"
          :style="{ animationDelay: `${index * 100 + 400}ms` }"
        >
          <div class="legend-color" :style="{ background: segment.color }"></div>
          <div class="legend-info">
            <div class="legend-label">{{ segment.label }}</div>
            <div class="legend-value">
              {{ segment.count }} <span class="legend-percentage">({{ segment.percentage }}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface StatusData {
  pending: number;
  active: number;
  completed: number;
  expired: number;
  suspended?: number;
}

interface Props {
  data: StatusData;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 280,
});

const radius = computed(() => (props.size / 2) - 40);
const strokeWidth = 35;
const circumference = computed(() => 2 * Math.PI * radius.value);

const total = computed(() => {
  return Object.values(props.data).reduce((sum, val) => sum + val, 0);
});

interface Segment {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

const segments = computed<Segment[]>(() => {
  const statusConfig = [
    { status: 'pending', label: 'En Attente', color: '#f59e0b' },
    { status: 'active', label: 'En Cours', color: '#3b82f6' },
    { status: 'completed', label: 'Terminés', color: '#22c55e' },
    { status: 'expired', label: 'Expirés', color: '#ef4444' },
  ];

  return statusConfig
    .map(config => {
      const count = props.data[config.status as keyof StatusData] || 0;
      const percentage = total.value > 0 ? Math.round((count / total.value) * 100) : 0;

      return {
        status: config.status,
        label: config.label,
        count,
        percentage,
        color: config.color,
      };
    })
    .filter(segment => segment.count > 0);
});

const calculateDashArray = (percentage: number) => {
  const segmentLength = (percentage / 100) * circumference.value;
  return `${segmentLength} ${circumference.value}`;
};

const calculateDashOffset = (index: number) => {
  let offset = 0;
  for (let i = 0; i < index; i++) {
    const prevPercentage = segments.value[i].percentage;
    offset += (prevPercentage / 100) * circumference.value;
  }
  return -offset;
};
</script>

<style scoped>
.status-chart-container {
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

.chart-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 24px 0;
}

.chart-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.donut-chart {
  flex-shrink: 0;
}

.donut-segment {
  transition: stroke-width 0.3s ease, opacity 0.3s ease;
  animation: drawSegment 1s ease-out forwards;
  stroke-dasharray: 0 1000;
}

@keyframes drawSegment {
  to {
    stroke-dasharray: inherit;
  }
}

.donut-segment:hover {
  stroke-width: 40;
  opacity: 0.8;
}

.center-text {
  font-family: system-ui, -apple-system, sans-serif;
}

.center-total {
  font-size: 2.5rem;
  font-weight: 700;
  fill: #111827;
}

.center-label {
  font-size: 0.875rem;
  font-weight: 500;
  fill: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  animation: slideInRight 0.4s ease-out backwards;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.legend-item:hover {
  background: #f9fafb;
  transform: translateX(4px);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-info {
  flex: 1;
}

.legend-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 2px;
}

.legend-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}

.legend-percentage {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

@media (max-width: 768px) {
  .chart-wrapper {
    flex-direction: column;
    gap: 24px;
  }

  .chart-legend {
    width: 100%;
  }
}
</style>
