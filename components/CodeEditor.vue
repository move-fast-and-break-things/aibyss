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
  if (target && Math.random() > 0.3) {
    api.moveTowards(target);
  } else {
    api.moveTo({
      x: Math.random() > 0.5
        ? Math.max(api.me.x - 10, 0)
        : Math.min(api.me.x + 10, api.worldWidth),
      y: Math.random() > 0.5
        ? Math.max(api.me.y - 10, 0)
        : Math.min(api.me.y + 10, api.worldHeight),
    });
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
 * @property {number} worldHeight
 * @property {number} worldWidth
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
  <div
    class="w-full h-full font-sans"
    data-testid="code-editor"
  >
    <form
      class="flex h-full flex-col"
      @submit="onSubmit"
    >
      <MonacoEditor
        v-model="state.code"
        lang="javascript"
        class="flex-grow mb-4 shadow"
      />
      <div class="flex justify-end">
        <button
          type="submit"
          class="h-10 px-6 font-semibold shadow bg-black text-white hover:bg-gray-800"
        >
          Submit
        </button>
      </div>
    </form>
  </div>
</template>
