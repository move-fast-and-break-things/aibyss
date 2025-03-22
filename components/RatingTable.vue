<script setup lang="ts">
const { data: rating, status } = await useFetch("/api/rating");

const isModalOpen = ref(false);

// Compute top values for highlighting
const topKills = computed(() => {
  if (!rating.value?.length) return 0;
  return Math.max(...rating.value.map(user => user.kills));
});

const topDeaths = computed(() => {
  if (!rating.value?.length) return 0;
  return Math.max(...rating.value.map(user => user.deaths));
});

const topFoodEaten = computed(() => {
  if (!rating.value?.length) return 0;
  return Math.max(...rating.value.map(user => user.foodEaten));
});

const topKD = computed(() => {
  if (!rating.value?.length) return 0;
  return Math.max(...rating.value.map(user => 
    user.deaths ? user.kills / user.deaths : user.kills > 0 ? Infinity : 0
  ));
});
</script>

<template>
  <div class="flex flex-col mx-auto items-center max-w-full gap-8">
    <div class="text-lg font-semibold">
      Player rating for the last 7 days
    </div>

    <div class="flex mx-auto relative overflow-x-auto shadow-md max-w-full">
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
                24h score
              </th>
              <th
                scope="col"
                class="px-6 py-3"
              >
                <ButtonLink
                  class="uppercase text-left"
                  @click="isModalOpen = true"
                >
                  1h score
                </ButtonLink>
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
                k/d
              </th>
              <th
                scope="col"
                class="px-6 py-3"
              >
                food eaten
              </th>
              <th
                scope="col"
                class="px-6 py-3 bg-gray-50 dark:bg-gray-800"
              >
                max endgame size
              </th>
              <th
                scope="col"
                class="px-6 py-3"
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
                {{ userRating.score7days }}
              </td>
              <td class="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                {{ userRating.score24hours }}
              </td>
              <td class="px-6 py-4">
                {{ userRating.score1hour }}
              </td>
              <td class="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                {{ userRating.wins }}
              </td>
              <td class="px-6 py-4">
                {{ userRating.gamesPlayed }}
              </td>
              <td class="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                <span :class="{ 'font-bold': userRating.kills === topKills }">
                  {{ userRating.kills }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span :class="{ 'font-bold': userRating.deaths === topDeaths }">
                  {{ userRating.deaths }}
                </span>
              </td>
              <td class="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                <span :class="{ 'font-bold': userRating.deaths && (userRating.kills / userRating.deaths) === topKD || (!userRating.deaths && userRating.kills > 0 && topKD === Infinity) }">
                  {{ userRating.deaths ? (userRating.kills / userRating.deaths).toFixed(2) : "n/a" }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span :class="{ 'font-bold': userRating.foodEaten === topFoodEaten }">
                  {{ userRating.foodEaten }}
                </span>
              </td>
              <td class="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                {{ userRating.maxEndgameSize.toFixed(2) }}
              </td>
              <td class="px-6 py-4">
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

    <ModalDialog
      :open="isModalOpen"
      :on-close="() => (isModalOpen = false)"
      extra-modal-class="max-w-[800px] min-h-0 h-auto w-[800px]"
    >
      <RatingChart
        v-if="rating"
        :rating="rating"
      />
    </ModalDialog>
  </div>
</template>
