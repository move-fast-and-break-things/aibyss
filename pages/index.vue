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
import { useSplitterPosition } from '~/composables/useSplitterPosition';

export default defineComponent({
  setup() {
    const isResizing = ref(false);
    const initialX = ref(0);
    const initialWidthEditor = ref(0);
    const initialWidthGame = ref(0);
    const resizeEditorElement = ref<HTMLDivElement | null>(null);
    const resizeGameElement = ref<HTMLDivElement | null>(null);
    const separator = ref<HTMLDivElement | null>(null);
    const { position } = useSplitterPosition(50); // default to 50% split

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
      
      // Save the current position as percentage when resizing stops
      if (resizeEditorElement.value && resizeGameElement.value) {
        const totalWidth = resizeEditorElement.value.offsetWidth + resizeGameElement.value.offsetWidth;
        const editorPercentage = (resizeEditorElement.value.offsetWidth / totalWidth) * 100;
        position.value = editorPercentage;
      }
    };

    onMounted(() => {
      // Apply the saved position on mount
      if (resizeEditorElement.value && resizeGameElement.value) {
        const totalWidth = resizeEditorElement.value.offsetWidth + resizeGameElement.value.offsetWidth;
        const editorWidth = (position.value / 100) * totalWidth;
        const gameWidth = totalWidth - editorWidth;
        
        resizeEditorElement.value.style.width = `${editorWidth}px`;
        resizeGameElement.value.style.width = `${gameWidth}px`;
      }
      
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
      resizeEditorElement,
      resizeGameElement,
      separator,
    };
  },
});
</script>
