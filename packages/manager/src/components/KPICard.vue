<template>
  <div class="kpi-card" :class="`kpi-card--${color}`">
    <div class="kpi-card__icon">
      <component :is="iconComponent" class="w-8 h-8" />
    </div>
    <div class="kpi-card__content">
      <div class="kpi-card__header">
        <h3 class="kpi-card__title">{{ title }}</h3>
        <span v-if="trend" class="kpi-card__trend" :class="trendClass">
          {{ trendIcon }} {{ trend }}
        </span>
      </div>
      <p class="kpi-card__value">{{ displayedValue }}</p>
      <p v-if="subtitle" class="kpi-card__subtitle">{{ subtitle }}</p>

      <!-- Mini sparkline -->
      <div v-if="sparklineData && sparklineData.length > 0" class="kpi-card__sparkline">
        <svg :viewBox="`0 0 ${sparklineData.length * 10} 30`" preserveAspectRatio="none">
          <polyline
            :points="sparklinePoints"
            :class="`sparkline-line sparkline-line--${color}`"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useAnimatedCounter } from '../composables/useAnimatedCounter';

interface Props {
  title: string;
  value: number | string;
  icon?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  subtitle?: string;
  trend?: string; // e.g., "+12%", "-5%"
  sparklineData?: number[]; // Array of numbers for mini chart
  animationDelay?: number; // Delay in ms for staggered animation
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'chart',
  color: 'blue',
  animationDelay: 0,
});

const iconComponent = computed(() => {
  const icons: Record<string, string> = {
    play: '▶️',
    clock: '🕐',
    check: '✅',
    dollar: '💵',
    chart: '📊',
    warning: '⚠️',
    user: '👤',
    calendar: '📅',
  };
  return icons[props.icon] || icons.chart;
});

// Extract numeric value for animation
const numericValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value;
  }
  // Try to extract number from string (e.g., "1 234 €" -> 1234)
  const match = String(props.value).match(/[\d\s,]+/);
  if (match) {
    return parseFloat(match[0].replace(/[\s,]/g, ''));
  }
  return 0;
});

const targetValue = ref(numericValue.value);
watch(() => props.value, () => {
  targetValue.value = numericValue.value;
});

// Use animated counter for numeric values
const { displayed } = useAnimatedCounter(targetValue, {
  duration: 1500,
  decimals: 0,
});

// Format the displayed value
const displayedValue = computed(() => {
  if (typeof props.value === 'string' && props.value.includes('€')) {
    // For currency, format with euro sign
    return Math.round(displayed.value).toLocaleString('fr-FR') + ' €';
  } else if (typeof props.value === 'number') {
    return Math.round(displayed.value).toLocaleString('fr-FR');
  }
  return props.value;
});

// Trend indicator
const trendClass = computed(() => {
  if (!props.trend) return '';
  return props.trend.startsWith('+') ? 'trend-up' : 'trend-down';
});

const trendIcon = computed(() => {
  if (!props.trend) return '';
  return props.trend.startsWith('+') ? '↑' : '↓';
});

// Sparkline calculation
const sparklinePoints = computed(() => {
  if (!props.sparklineData || props.sparklineData.length === 0) return '';

  const data = props.sparklineData;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return data
    .map((value, index) => {
      const x = index * 10 + 5;
      const y = 30 - ((value - min) / range) * 25;
      return `${x},${y}`;
    })
    .join(' ');
});

// Trigger animation on mount with delay
onMounted(() => {
  if (props.animationDelay > 0) {
    setTimeout(() => {
      targetValue.value = numericValue.value;
    }, props.animationDelay);
  }
});
</script>

<style scoped>
.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.6s ease-out;
  animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.kpi-card__icon {
  font-size: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.1);
}

.kpi-card--green .kpi-card__icon {
  background: rgba(34, 197, 94, 0.1);
}

.kpi-card--orange .kpi-card__icon {
  background: rgba(249, 115, 22, 0.1);
}

.kpi-card--red .kpi-card__icon {
  background: rgba(239, 68, 68, 0.1);
}

.kpi-card--purple .kpi-card__icon {
  background: rgba(168, 85, 247, 0.1);
}

.kpi-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.kpi-card__title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-card__trend {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
}

.kpi-card__trend.trend-up {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.kpi-card__trend.trend-down {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.kpi-card__value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1;
}

.kpi-card--blue .kpi-card__value {
  color: #3b82f6;
}

.kpi-card--green .kpi-card__value {
  color: #22c55e;
}

.kpi-card--orange .kpi-card__value {
  color: #f97316;
}

.kpi-card--red .kpi-card__value {
  color: #ef4444;
}

.kpi-card--purple .kpi-card__value {
  color: #a855f7;
}

.kpi-card__subtitle {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
}

.kpi-card__sparkline {
  margin-top: 8px;
  width: 100%;
  height: 30px;
  opacity: 0.7;
}

.kpi-card__sparkline svg {
  width: 100%;
  height: 100%;
}

.sparkline-line {
  fill: none;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: drawLine 1s ease-out forwards;
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

.sparkline-line--blue {
  stroke: #3b82f6;
}

.sparkline-line--green {
  stroke: #22c55e;
}

.sparkline-line--orange {
  stroke: #f97316;
}

.sparkline-line--red {
  stroke: #ef4444;
}

.sparkline-line--purple {
  stroke: #a855f7;
}

@media (max-width: 768px) {
  .kpi-card {
    padding: 16px;
    gap: 12px;
  }

  .kpi-card__icon {
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
  }

  .kpi-card__value {
    font-size: 1.5rem;
  }
}
</style>
