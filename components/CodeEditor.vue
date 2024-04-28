<script setup lang="ts">
const defaultCode = `/**
 * Implement your strategy in the function "step".
 * This function will be called once per frame.
 * Reference the types below the function for information about the API.
 *
 * @param {API} api
 */
function step(api) {
  const target = api.otherPlayers[0];
  if (target) {
    api.moveTowards(target);
  } else {
    api.moveTo({ x: 0, y: 0 })
  }
}

/**
 * @typedef {object} Player
 * @property {number} x
 * @property {number} y
 * @property {number} radius
 */

/**
 * @typedef {object} Food
 * @property {number} x
 * @property {number} y
 * @property {number} radius
 */

/**
 * @typedef {object} API
 * @property {Player} me
 * @property {Player[]} otherPlayers
 * @property {Food[]} food
 * @property {MoveTowards} moveTowards
 * @property {MoveTo} moveTo
 */

/**
 * @callback MoveTowards
 * @param {Player} player
 */

/**
 * @typedef {object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * @callback MoveTo
 * @param {Position} position
 */
`;

const state = reactive<{ code: string }>({
  code: defaultCode,
});

function onSubmit(event: Event) {
  event.preventDefault();

  fetch("/api/bot/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: state.code }),
  });
}
</script>

<template>
  <div class="w-full h-full font-sans">
    <form
      class="flex h-full flex-col"
      @submit="onSubmit"
    >
      <MonacoEditor
        v-model="state.code"
        lang="javascript"
        class="flex-grow mb-4"
      />
      <div class="flex justify-end">
        <button
          type="submit"
          class="h-10 px-6 font-semibold rounded-md bg-black text-white"
        >
          Submit
        </button>
      </div>
    </form>
  </div>
</template>
