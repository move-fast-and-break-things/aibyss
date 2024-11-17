<template>
  <div class="flex flex-col h-screen w-screen">
    <GlobalHeader />
    <div
      class="flex flex-grow p-4"
      style="height: 90%;"
    >
      <div
        ref="resizeEditorElement"
        class="flex min-w-[300px] flex-grow resize-x mr-2"
      >
        <CodeEditor />
      </div>
      <div
        ref="separator"
        class="separator"
      />
      <div
        ref="resizeGameElement"
        class="flex min-w-[300px] resize-x overflow-auto"
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
    const resizeEditorElement = ref<HTMLDivElement | null>(null);
    const resizeGameElement = ref<HTMLDivElement | null>(null);
    const separator = ref<HTMLDivElement | null>(null);

    const startResize = (e: MouseEvent) => {
      if (resizeEditorElement.value && resizeGameElement.value) {
        isResizing.value = true;
        initialX.value = e.clientX;
        initialWidthEditor.value = resizeEditorElement.value.offsetWidth;
        initialWidthGame.value = resizeGameElement.value.offsetWidth;
      }
    };

    const handleResize = (e: MouseEvent) => {
      if (isResizing.value && resizeEditorElement.value && resizeGameElement.value) {
        const dx = e.clientX - initialX.value;
        const newWidthEditor = initialWidthEditor.value + dx;
        const newWidthGame = initialWidthGame.value - dx;
        resizeEditorElement.value.style.width = `${newWidthEditor}px`;
        resizeGameElement.value.style.width = `${newWidthGame}px`;
      }
    };

    const stopResize = () => {
      isResizing.value = false;
    };

    onMounted(() => {
      if (separator.value) {
        separator.value.addEventListener("mousedown", startResize);
      }
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
    });

    onUnmounted(() => {
      if (separator.value) {
        separator.value.removeEventListener("mousedown", startResize);
      }
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
    });
    return {
      resizeEditorElement,
      resizeGameElement,
      separator,
    };
  },
});
</script>

<style scoped>
 .separator {
    @apply w-1 bg-gray-300 cursor-ew-resize;
  }
  .resize-x:first-of-type {
    @apply w-1/2;
  }
  .resize-x:last-of-type {
    @apply w-1/2;
  } .flex-grow {
    @apply flex h-full;
  }
</style>
