<template>
  <div class="flex flex-col h-screen w-screen">
    <GlobalHeader />
    <div class="flex flex-grow p-1 h-[90%]">
      <div
        ref="resizeLoginElement"
        class="flex min-w-[300px] h-full w-1/2 mr-2"
      >
        <div class="flex flex-grow p-4 justify-center">
          <form
            method="post"
            action="/api/auth/login"
            class="flex flex-col items-center gap-2 mt-[15%]"
          >
            <div class="sm:col-span-3 flex flex-col gap-1">
              <label
                for="username"
                class="block text-sm font-medium leading-6 text-gray-900"
              >Username</label>
              <input
                id="username"
                type="text"
                name="username"
                autocomplete="username"
                autofocus
                required
                class="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
            </div>
            <div class="sm:col-span-3 flex flex-col gap-1">
              <label
                for="password"
                class="block text-sm font-medium leading-6 text-gray-900"
              >Password</label>
              <input
                id="password"
                type="password"
                name="password"
                autocomplete="password"
                required
                class="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
            </div>
            <button
              type="submit"
              class="rounded-md bg-indigo-600 px-3 py-2 mt-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Log in
            </button>
          </form>
        </div>
      </div>
      <div
        ref="separator"
        class="w-1 bg-gray-300 cursor-ew-resize"
      />
      <div
        ref="resizeGameElement"
        class="flex min-w-[300px] w-1/2 overflow-auto"
      >
        <GameScreen />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from "vue";

export default defineComponent({
  setup() {
    const isResizing = ref(false);
    const initialX = ref(0);
    const initialWidthEditor = ref(0);
    const initialWidthGame = ref(0);
    const resizeLoginElement = ref<HTMLDivElement | null>(null);
    const resizeGameElement = ref<HTMLDivElement | null>(null);
    const separator = ref<HTMLDivElement | null>(null);

    const startResize = (e: MouseEvent) => {
      if (!resizeLoginElement.value) {
        throw new Error("unexpected: no resizeEditorElement");
      }
      if (!resizeGameElement.value) {
        throw new Error("unexpected: no resizeGameElement");
      }
      isResizing.value = true;
      initialX.value = e.clientX;
      initialWidthEditor.value = resizeLoginElement.value.offsetWidth;
      initialWidthGame.value = resizeGameElement.value.offsetWidth;
    };

    const handleResize = (e: MouseEvent) => {
      if (!resizeLoginElement.value) {
        throw new Error("unexpected: no resizeEditorElement");
      }
      if (!resizeGameElement.value) {
        throw new Error("unexpected: no resizeGameElement");
      }
      if (isResizing.value) {
        const dx = e.clientX - initialX.value;
        const newWidthEditor = initialWidthEditor.value + dx;
        const newWidthGame = initialWidthGame.value - dx;
        resizeLoginElement.value.style.width = `${newWidthEditor}px`;
        resizeGameElement.value.style.width = `${newWidthGame}px`;
      }
    };

    const stopResize = () => {
      isResizing.value = false;
    };

    onMounted(() => {
      if (!separator.value) {
        throw new Error("unexpected: no separator");
      }
      separator.value.addEventListener("mousedown", startResize);
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
    });

    onUnmounted(() => {
      if (!separator.value) {
        throw new Error("unexpected: no separator");
      }
      separator.value.removeEventListener("mousedown", startResize);
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
    });
    return {
      resizeLoginElement,
      resizeGameElement,
      separator,
    };
  },
});
</script>
