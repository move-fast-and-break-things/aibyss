<template>
  <div class="flex flex-col h-screen w-screen">
    <GlobalHeader />
    <div class="flex flex-grow p-1 h-[90%]">
      <div
        ref="resizeEditorElement"
        class="flex min-w-[300px] h-full w-1/2 mr-2"
      >
        <CodeEditor />
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

const STORAGE_KEY = "aibyss-splitter-position";
const MIN_WIDTH_PX = 300; // Minimum width for each pane in pixels

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
      if (!resizeEditorElement.value) {
        throw new Error("unexpected: no resizeEditorElement");
      }
      if (!resizeGameElement.value) {
        throw new Error("unexpected: no resizeGameElement");
      }
      isResizing.value = true;
      initialX.value = e.clientX;
      initialWidthEditor.value = resizeEditorElement.value.offsetWidth;
      initialWidthGame.value = resizeGameElement.value.offsetWidth;
    };

    const handleResize = (e: MouseEvent) => {
      if (!resizeEditorElement.value) {
        throw new Error("unexpected: no resizeEditorElement");
      }
      if (!resizeGameElement.value) {
        throw new Error("unexpected: no resizeGameElement");
      }
      if (isResizing.value) {
        const dx = e.clientX - initialX.value;
        const newWidthEditor = initialWidthEditor.value + dx;
        const newWidthGame = initialWidthGame.value - dx;
        resizeEditorElement.value.style.width = `${newWidthEditor}px`;
        resizeGameElement.value.style.width = `${newWidthGame}px`;
      }
    };

    const stopResize = () => {
      isResizing.value = false;

      if (!resizeEditorElement.value) {
        return;
      }
      localStorage.setItem(STORAGE_KEY, resizeEditorElement.value.offsetWidth.toString());
    };

    const loadSavedPosition = () => {
      if (!resizeEditorElement.value || !resizeGameElement.value) {
        return;
      }
      try {
        const savedWidth = localStorage.getItem(STORAGE_KEY);
        if (savedWidth) {
          const containerWidth = resizeEditorElement.value.offsetWidth + resizeGameElement.value.offsetWidth;
          const editorWidth = parseInt(savedWidth, 10);
          const gameWidth = containerWidth - editorWidth;

          // Ensure minimum widths
          if (editorWidth >= MIN_WIDTH_PX && gameWidth >= MIN_WIDTH_PX) {
            resizeEditorElement.value.style.width = `${editorWidth}px`;
            resizeGameElement.value.style.width = `${gameWidth}px`;
          }
        }
      } catch (e) {
        console.error("Failed to load splitter position from localStorage:", e);
      }
    };

    onMounted(() => {
      if (!separator.value) {
        throw new Error("unexpected: no separator");
      }
      separator.value.addEventListener("mousedown", startResize);
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);

      loadSavedPosition();
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
      resizeEditorElement,
      resizeGameElement,
      separator,
    };
  },
});
</script>
