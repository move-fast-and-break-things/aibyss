<script setup lang="ts">
const { data: rating, status } = await useFetch("/api/rating");

const games = rating.value?.map(game => ({
  ...game,
  start_time: new Date(game.start_time),
  end_time: new Date(game.end_time),
}));
</script>

<template>
  <div>
    <div v-if="status === 'pending'">
      Loading...
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
          stats)
        </li>
      </ul>
      <div v-if="!games?.length">
        No games 😔
      </div>
    </div>
  </div>
</template>
