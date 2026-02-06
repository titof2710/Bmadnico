<template>
  <div class="radar-chart-container">
    <h3 class="chart-title">{{ title }}</h3>

    <div class="chart-wrapper">
      <svg :width="size" :height="size" class="radar-chart" :viewBox="`0 0 ${size} ${size}`">
        <g :transform="`translate(${center}, ${center})`">
          <!-- Background circles (grid) -->
          <g class="grid-circles">
            <circle
              v-for="i in 5"
              :key="`circle-${i}`"
              :r="(radius / 5) * i"
              fill="none"
              stroke="#e5e7eb"
              stroke-width="1"
            />
          </g>

          <!-- Axis lines -->
          <g class="axis-lines">
            <line
              v-for="(dimension, index) in dimensions"
              :key="`axis-${index}`"
              x1="0"
              y1="0"
              :x2="getAxisPoint(index).x"
              :y2="getAxisPoint(index).y"
              stroke="#d1d5db"
              stroke-width="1"
            />
          </g>

          <!-- Average score polygon (background) -->
          <polygon
            v-if="showAverage && averageScores"
            :points="getPolygonPoints(averageScores)"
            fill="rgba(156, 163, 175, 0.1)"
            stroke="#9ca3af"
            stroke-width="2"
            stroke-dasharray="5,5"
            class="average-polygon"
          />

          <!-- Participant score polygon -->
          <polygon
            :points="participantPolygonPoints"
            :fill="fillColor"
            :stroke="strokeColor"
            stroke-width="3"
            class="score-polygon"
          />

          <!-- Score points -->
          <circle
            v-for="(dimension, index) in dimensions"
            :key="`point-${index}`"
            :cx="getScorePoint(index, scores[dimension.key]).x"
            :cy="getScorePoint(index, scores[dimension.key]).y"
            r="5"
            :fill="strokeColor"
            class="score-point"
            :style="{ animationDelay: `${index * 100}ms` }"
          />

          <!-- Labels -->
          <text
            v-for="(dimension, index) in dimensions"
            :key="`label-${index}`"
            :x="getLabelPoint(index).x"
            :y="getLabelPoint(index).y"
            text-anchor="middle"
            class="axis-label"
            :style="{ animationDelay: `${index * 50 + 500}ms` }"
          >
            <tspan :x="getLabelPoint(index).x" dy="0">{{ dimension.label }}</tspan>
            <tspan :x="getLabelPoint(index).x" dy="1.2em" class="axis-score">
              {{ scores[dimension.key].toFixed(1) }}
            </tspan>
          </text>
        </g>
      </svg>

      <!-- Legend -->
      <div v-if="showAverage && averageScores" class="chart-legend">
        <div class="legend-item">
          <div class="legend-line" :style="{ background: strokeColor }"></div>
          <span>Participant</span>
        </div>
        <div class="legend-item">
          <div class="legend-line legend-line--dashed"></div>
          <span>Moyenne</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Dimension {
  key: string;
  label: string;
}

interface Scores {
  [key: string]: number;
}

interface Props {
  title?: string;
  dimensions: Dimension[];
  scores: Scores;
  averageScores?: Scores;
  showAverage?: boolean;
  size?: number;
  maxScore?: number;
  fillColor?: string;
  strokeColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Analyse des Compétences',
  showAverage: true,
  size: 400,
  maxScore: 10,
  fillColor: 'rgba(59, 130, 246, 0.2)',
  strokeColor: '#3b82f6',
});

const center = computed(() => props.size / 2);
const radius = computed(() => (props.size / 2) - 80);

const getAxisPoint = (index: number) => {
  const angle = (Math.PI * 2 * index) / props.dimensions.length - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius.value,
    y: Math.sin(angle) * radius.value,
  };
};

const getScorePoint = (index: number, score: number) => {
  const angle = (Math.PI * 2 * index) / props.dimensions.length - Math.PI / 2;
  const distance = (score / props.maxScore) * radius.value;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
};

const getLabelPoint = (index: number) => {
  const angle = (Math.PI * 2 * index) / props.dimensions.length - Math.PI / 2;
  const distance = radius.value + 40;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
};

const getPolygonPoints = (scores: Scores) => {
  return props.dimensions
    .map((dim, index) => {
      const point = getScorePoint(index, scores[dim.key] || 0);
      return `${point.x},${point.y}`;
    })
    .join(' ');
};

const participantPolygonPoints = computed(() => getPolygonPoints(props.scores));
</script>

<style scoped>
.radar-chart-container {
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
  text-align: center;
}

.chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.radar-chart {
  max-width: 100%;
  height: auto;
}

.score-polygon {
  animation: drawPolygon 1s ease-out forwards;
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
}

@keyframes drawPolygon {
  to {
    stroke-dashoffset: 0;
  }
}

.average-polygon {
  opacity: 0;
  animation: fadeIn 0.6s ease-out 0.8s forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

.score-point {
  animation: scaleIn 0.4s ease-out backwards;
  transition: r 0.2s ease;
}

@keyframes scaleIn {
  from {
    r: 0;
  }
  to {
    r: 5;
  }
}

.score-point:hover {
  r: 7;
}

.axis-label {
  font-size: 0.875rem;
  font-weight: 600;
  fill: #374151;
  animation: fadeIn 0.4s ease-out backwards;
}

.axis-score {
  font-size: 1rem;
  font-weight: 700;
  fill: #111827;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.legend-line {
  width: 32px;
  height: 3px;
  border-radius: 2px;
}

.legend-line--dashed {
  background: repeating-linear-gradient(
    to right,
    #9ca3af 0,
    #9ca3af 5px,
    transparent 5px,
    transparent 10px
  );
}

@media (max-width: 640px) {
  .radar-chart-container {
    padding: 16px;
  }

  .chart-title {
    font-size: 1.125rem;
  }

  .axis-label {
    font-size: 0.75rem;
  }

  .chart-legend {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
