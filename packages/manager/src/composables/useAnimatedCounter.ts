import { ref, watch, Ref } from 'vue';

export interface AnimatedCounterOptions {
  duration?: number;
  decimals?: number;
  easing?: (t: number) => number;
}

// Easing function for smooth animation (ease-out cubic)
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export function useAnimatedCounter(
  target: Ref<number>,
  options: AnimatedCounterOptions = {}
) {
  const {
    duration = 1500,
    decimals = 0,
    easing = easeOutCubic,
  } = options;

  const displayed = ref(0);
  const isAnimating = ref(false);

  const animate = () => {
    if (isAnimating.value) return;

    isAnimating.value = true;
    const startValue = displayed.value;
    const endValue = target.value;
    const startTime = Date.now();

    const step = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      displayed.value = startValue + (endValue - startValue) * easedProgress;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        displayed.value = endValue;
        isAnimating.value = false;
      }
    };

    requestAnimationFrame(step);
  };

  // Auto-animate when target changes
  watch(target, () => {
    animate();
  }, { immediate: true });

  // Format the displayed value with proper decimals
  const formattedValue = ref('0');
  watch(displayed, (newValue) => {
    formattedValue.value = newValue.toFixed(decimals);
  });

  return {
    displayed,
    formattedValue,
    animate,
    isAnimating,
  };
}
