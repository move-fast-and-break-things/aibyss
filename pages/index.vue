<template>
  <div class="flex flex-col h-screen w-screen">
    <GlobalHeader />
    <div
      class="flex flex-grow p-4"
      style="height: 90%;"
    >
      <div class="flex min-w-[300px] flex-grow resize-x overflow-auto">
        <CodeEditor />
      </div>
      <div class="separator" />
      <div class="flex min-w-[300px] resize-x overflow-auto">
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

    const startResize = (e: MouseEvent) => {
      isResizing.value = true;
      initialX.value = e.clientX;
      const resizeEditorElement = document.querySelector(".resize-x:first-of-type") as HTMLElement;
      const resizeGameElement = document.querySelector(".resize-x:last-of-type") as HTMLElement;
      initialWidthEditor.value = resizeEditorElement.offsetWidth;
      initialWidthGame.value = resizeGameElement.offsetWidth;
    };

    const handleResize = (e: MouseEvent) => {
      if (isResizing.value) {
        const dx = e.clientX - initialX.value;
        const resizeEditorElement = document.querySelector(".resize-x:first-of-type") as HTMLElement;
        const resizeGameElement = document.querySelector(".resize-x:last-of-type") as HTMLElement;
        const newWidthEditor = initialWidthEditor.value + dx;
        const newWidthGame = initialWidthGame.value - dx;
        resizeEditorElement.style.width = `${newWidthEditor}px`;
        resizeGameElement.style.width = `${newWidthGame}px`;
      }
    };

    const stopResize = () => {
      isResizing.value = false;
    };

    onMounted(() => {
      const separator = document.querySelector(".separator") as HTMLElement;
      separator.addEventListener("mousedown", startResize);
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
    });

    onUnmounted(() => {
      const separator = document.querySelector(".separator") as HTMLElement;
      separator.removeEventListener("mousedown", startResize);
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
    });

    return {
      startResize,
      handleResize,
      stopResize,
    };
  },
});
</script>

<style scoped>
.separator {
  width: 5px;
  background-color: #ccc;
  cursor: ew-resize;
}

.resize-x {
  width: 50%;
}

.flex-grow {
  display: flex;
  height: calc(100% - 2 * 2.5px); /* Adjust for separator height */
}
</style>
