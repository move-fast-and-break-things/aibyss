<script setup lang="ts">
const { data: rating, status } = await useFetch("/api/rating");
</script>

<template>
  <div class="flex flex-col mx-auto items-center max-w-full">
    <div class="text-lg font-semibold">
      Player rating for the last 7 days
    </div>

    <div class="flex mx-auto relative overflow-x-auto shadow-md mt-8 max-w-full">
      <div v-if="status === 'pending'">
        Loading...
      </div>
      <div v-else>
        <table class="w-full text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead class="text-xs text-gray-700 uppercase dark:text-gray-400">
            <tr>
              <th
                scope="col"
                class="px-6 py-3"
              >
                🏆
              </th>
              <th
                scope="col"
                class="px-6 py-3 bg-gray-50 dark:bg-gray-800"
              >
                username
              </th>
              <th
                scope="col"
                class="px-6 py-3"
              >
                score
              </th>
              <th
                scope="col"
                class="px-6 py-3 bg-gray-50 dark:bg-gray-800"
              >
                wins
              </th>
              <th
                scope="col"
                class="px-6 py-3"
              >
                games played
              </th>
              <th
                scope="col"
                class="px-6 py-3 bg-gray-50 dark:bg-gray-800"
              >
                kills
              </th>
              <th
                scope="col"
                class="px-6 py-3"
              >
                deaths
              </th>
              <th
                scope="col"
                class="px-6 py-3 bg-gray-50 dark:bg-gray-800"
              >
                food eaten
              </th>
              <th
                scope="col"
                class="px-6 py-3"
              >
                max endgame size
              </th>
              <th
                scope="col"
                class="px-6 py-3 bg-gray-50 dark:bg-gray-800"
              >
                avg endgame size
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(userRating, index) in rating"
              :key="userRating.userId"
              class="border-b border-gray-200 dark:border-gray-700"
            >
              <th
                scope="row"
                class="px-6 py-4 font-medium text-gray-900"
              >
                {{ index + 1 }}
              </th>
              <th
                scope="row"
                class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap bg-gray-50 dark:text-white dark:bg-gray-800"
              >
                {{ userRating.username }}
              </th>
              <td class="px-6 py-4">
                {{ userRating.score }}
              </td>
              <td class="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                {{ userRating.wins }}
              </td>
              <td class="px-6 py-4">
                {{ userRating.gamesPlayed }}
              </td>
              <td class="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                {{ userRating.kills }}
              </td>
              <td class="px-6 py-4">
                {{ userRating.deaths }}
              </td>
              <td class="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                {{ userRating.foodEaten }}
              </td>
              <td class="px-6 py-4">
                {{ userRating.maxEndgameSize }}
              </td>
              <td class="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                {{ userRating.avgEndgameSize.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!rating?.length">
          No users 😔
        </div>
      </div>
    </div>
  </div>
</template>
