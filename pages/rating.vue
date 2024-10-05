<script setup lang="ts">
import type { Game, GameStats, User } from "@prisma/client";

type GameWithStatsAndUser = Game & {
  game_stats: (GameStats & {
    user: User;
  })[];
};

type gameStats = {
  game_id: number;
  start_time: string;
  end_time: string;
  end_reason: string;
  game_stats: Array<unknown>;
};

const games = ref<GameWithStatsAndUser[]>([]);
const isLoading = ref(true);

onMounted(async () => {
  console.log("Fetching games...");

  try {
    const response = await fetch("/api/rating");
    const data = await response.json();

    if (Array.isArray(data)) {
      games.value = data.map((game: gameStats) => ({
        ...game,
        start_time: new Date(game.start_time),
        end_time: new Date(game.end_time),
      })) as GameWithStatsAndUser[];
      isLoading.value = false;
    } else {
      console.warn("Unexpected data format:", data);
    }
  } catch (error) {
    console.error("Failed to fetch games:", error);
  }
});
</script>

<template>
  <div>
    <div v-if="isLoading">
      Загрузка...
    </div>
    <div v-else>
      <ul>
        <li
          v-for="game in games"
          :key="game.game_id"
        >
          {{ game.start_time }} - {{ game.end_time }} ({{
            game.game_stats.length
          }}
          статистик)
        </li>
      </ul>
      <div v-if="games.length === 0">
        Нет доступных игр.
      </div>
    </div>
  </div>
</template>
