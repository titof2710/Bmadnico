<template>
  <div class="skeleton-loader" :class="`skeleton-${variant}`">
    <!-- Card variant -->
    <div v-if="variant === 'card'" class="skeleton-card">
      <div class="skeleton-header">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-lines">
          <div class="skeleton-line skeleton-line--title"></div>
          <div class="skeleton-line skeleton-line--subtitle"></div>
        </div>
      </div>
      <div class="skeleton-body">
        <div class="skeleton-line skeleton-line--full"></div>
        <div class="skeleton-line skeleton-line--full"></div>
        <div class="skeleton-line skeleton-line--medium"></div>
      </div>
    </div>

    <!-- Table row variant -->
    <div v-else-if="variant === 'table-row'" class="skeleton-table-row">
      <div class="skeleton-cell"></div>
      <div class="skeleton-cell"></div>
      <div class="skeleton-cell skeleton-cell--small"></div>
      <div class="skeleton-cell skeleton-cell--small"></div>
    </div>

    <!-- Chart variant -->
    <div v-else-if="variant === 'chart'" class="skeleton-chart">
      <div class="skeleton-chart-header">
        <div class="skeleton-line skeleton-line--title"></div>
      </div>
      <div class="skeleton-chart-body">
        <div class="skeleton-bar" style="height: 60%"></div>
        <div class="skeleton-bar" style="height: 80%"></div>
        <div class="skeleton-bar" style="height: 45%"></div>
        <div class="skeleton-bar" style="height: 90%"></div>
        <div class="skeleton-bar" style="height: 70%"></div>
        <div class="skeleton-bar" style="height: 55%"></div>
      </div>
    </div>

    <!-- KPI Card variant -->
    <div v-else-if="variant === 'kpi'" class="skeleton-kpi">
      <div class="skeleton-kpi-icon"></div>
      <div class="skeleton-kpi-content">
        <div class="skeleton-line skeleton-line--small"></div>
        <div class="skeleton-line skeleton-line--large"></div>
        <div class="skeleton-line skeleton-line--medium"></div>
      </div>
    </div>

    <!-- Default: Simple lines -->
    <div v-else class="skeleton-simple">
      <div class="skeleton-line skeleton-line--full"></div>
      <div class="skeleton-line skeleton-line--full"></div>
      <div class="skeleton-line skeleton-line--medium"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'card' | 'table-row' | 'chart' | 'kpi' | 'simple';
  count?: number;
}

withDefaults(defineProps<Props>(), {
  variant: 'simple',
  count: 1,
});
</script>

<style scoped>
.skeleton-loader {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Base skeleton element */
.skeleton-line,
.skeleton-avatar,
.skeleton-cell,
.skeleton-bar,
.skeleton-kpi-icon {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Card variant */
.skeleton-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 12px;
}

.skeleton-line--title {
  width: 60%;
  height: 16px;
}

.skeleton-line--subtitle {
  width: 40%;
  height: 12px;
}

.skeleton-line--full {
  width: 100%;
}

.skeleton-line--medium {
  width: 70%;
}

.skeleton-line--small {
  width: 40%;
  height: 10px;
}

.skeleton-line--large {
  width: 80%;
  height: 24px;
}

/* Table row variant */
.skeleton-table-row {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #f3f4f6;
}

.skeleton-cell {
  height: 20px;
  flex: 1;
}

.skeleton-cell--small {
  flex: 0.5;
}

/* Chart variant */
.skeleton-chart {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-chart-header {
  margin-bottom: 24px;
}

.skeleton-chart-body {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 200px;
}

.skeleton-bar {
  flex: 1;
  border-radius: 4px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* KPI Card variant */
.skeleton-kpi {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20px;
  align-items: center;
}

.skeleton-kpi-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  flex-shrink: 0;
}

.skeleton-kpi-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Simple variant */
.skeleton-simple {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
</style>
