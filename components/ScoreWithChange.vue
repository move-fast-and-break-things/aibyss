<script setup lang="ts">
const props = defineProps<{
  score: {
    value: number;
    change: number | null;
  };
}>();

const changeColorClass = computed(() => {
  if (props.score.change === null || props.score.change === 0) {
    return "text-gray-500 dark:text-gray-400";
  }
  return props.score.change > 0 ? "text-green-500" : "text-red-500";
});

const formattedChange = computed(() => {
  if (props.score.change === null) {
    return "new"; // Display for changes from 0
  }
  const sign = props.score.change > 0 ? "+" : "";
  // Use toFixed(0) for cleaner percentages unless you need decimals
  return `${sign}${props.score.change.toFixed(0)}%`;
});
</script>

<template>
  <div class="flex items-center gap-2 justify-start">
    <span>{{ score.value }}</span>
    <span
      v-if="score.change !== 0"
      :class="changeColorClass"
      class="text-xs font-semibold"
    >
      ({{ formattedChange }})
    </span>
  </div>
</template>
