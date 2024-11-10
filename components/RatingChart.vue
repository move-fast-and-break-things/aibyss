<script setup lang="ts">
import { Chart } from "chart.js/auto";
import { setRgbColorOpacity } from "~/other/setRgbColorOpacity";
import type { UserRating } from "~/server/api/rating.get";

const { rating } = defineProps<{ rating: UserRating[] }>();

const chart = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
  if (!chart.value) {
    throw new Error("chartContainer is not defined");
  }

  new Chart(
    chart.value,
    {
      type: "line",
      data: {
        labels: rating[0]?.scoreDynamic1hour.map((_, index) => index),
        datasets: rating.map(userRating => ({
          label: userRating.username,
          data: userRating.scoreDynamic1hour,
          pointStyle: false,
          tension: 0.2,
          borderWidth: 2,
        })),
      },
      options: {
        responsive: true,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            position: "bottom",
            onHover(event, legendItem, legend) {
              for (const [idx, dataset] of legend.chart.data.datasets.entries()) {
                if (typeof dataset.borderColor !== "string") {
                  throw new Error("unexpected borderColor");
                }
                dataset.borderColor = setRgbColorOpacity({
                  color: dataset.borderColor,
                  opacity: idx !== legendItem.datasetIndex ? 0.2 : 1,
                });
              }
              legend.chart.update();
            },
            onLeave(event, legendItem, legend) {
              for (const dataset of legend.chart.data.datasets) {
                if (typeof dataset.borderColor !== "string") {
                  throw new Error("unexpected borderColor");
                }
                dataset.borderColor = setRgbColorOpacity({
                  color: dataset.borderColor,
                  opacity: 1,
                });
              }
              legend.chart.update();
            },
          },
          title: {
            display: true,
            text: "1 hour score graph over the previous 7 days",
          },
        },
      },
    },
  );
});
</script>

<template>
  <canvas ref="chart" />
</template>
