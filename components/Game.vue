<script setup lang="ts">
// create canvas ref
const canvas = ref<HTMLCanvasElement | null>(null);
const context = ref<CanvasRenderingContext2D | null>(null);

const { data: gameState, refresh } = await useFetch('/api/state');

const intervalRef = ref<number | null>(null);

onMounted(async () =>  {
  const ctx = canvas.value?.getContext('2d', { alpha: false });
  if (!ctx) {
    window.alert("Can't render the game. Please, refresh the page. If the problem persists, report the issue at https://github.com/move-fast-and-break-things/aibyss/issues. Include as many details as possible.");
    return;
  }
  context.value = ctx;
  intervalRef.value = window.setInterval(refresh, 1000);
});

onBeforeUnmount(() => {
  if (intervalRef.value) {
    clearInterval(intervalRef.value);
  }
});

watch(gameState, newState => {
  if (!canvas.value || !newState) {
    return;
  }

  canvas.value.width = newState.width;
  canvas.value.height = newState.height;

  const ctx = canvas.value.getContext('2d', { alpha: false });
  if (!ctx) {
    window.alert("Can't render the game. Please, refresh the page. If the problem persists, report the issue at");
    throw new Error("Can't render the game");
  }
  context.value = ctx;

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

  for (const food of newState.food) {
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(food.x, food.y, food.radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  for (const bot of Object.values(newState.bots)) {
    ctx.fillStyle = bot.color;
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, bot.radius, 0, 2 * Math.PI);
    ctx.fill();
  }
});
</script>

<template>
  <div class="h-full w-full">
    <canvas ref="canvas"></canvas>
  </div>
</template>
