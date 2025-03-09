<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
  initialSplit: {
    type: Number,
    default: 50
  },
  minLeft: {
    type: Number,
    default: 20
  },
  minRight: {
    type: Number,
    default: 20
  },
  storageKey: {
    type: String,
    default: 'split-pane-position'
  }
});

const container = ref<HTMLDivElement | null>(null);
const splitter = ref<HTMLDivElement | null>(null);
const leftPane = ref<HTMLDivElement | null>(null);
const rightPane = ref<HTMLDivElement | null>(null);
const splitPercentage = ref(props.initialSplit);
const isDragging = ref(false);

// Load saved position from localStorage
onMounted(() => {
  const savedPosition = localStorage.getItem(props.storageKey);
  if (savedPosition) {
    splitPercentage.value = parseFloat(savedPosition);
  }
  updateSplit();
});

// Save position to localStorage when it changes
watch(splitPercentage, (newValue) => {
  localStorage.setItem(props.storageKey, newValue.toString());
});

function updateSplit() {
  if (!leftPane.value || !rightPane.value) return;
  
  leftPane.value.style.width = `${splitPercentage.value}%`;
  rightPane.value.style.width = `${100 - splitPercentage.value}%`;
}

function onMouseDown(e: MouseEvent) {
  isDragging.value = true;
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  e.preventDefault(); // Prevent text selection during drag
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value || !container.value) return;
  
  const containerRect = container.value.getBoundingClientRect();
  const containerWidth = containerRect.width;
  const mouseX = e.clientX - containerRect.left;
  
  // Calculate percentage position
  let newSplitPercentage = (mouseX / containerWidth) * 100;
  
  // Apply min constraints
  newSplitPercentage = Math.max(props.minLeft, Math.min(100 - props.minRight, newSplitPercentage));
  
  splitPercentage.value = newSplitPercentage;
  updateSplit();
}

function onMouseUp() {
  isDragging.value = false;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
}
</script>

<template>
  <div 
    ref="container" 
    class="split-pane-container flex flex-row h-full w-full"
  >
    <div 
      ref="leftPane" 
      class="split-pane-left overflow-hidden"
    >
      <slot name="left"></slot>
    </div>
    
    <div 
      ref="splitter" 
      class="split-pane-divider w-1 bg-gray-300 hover:bg-gray-500 cursor-col-resize transition-colors"
      @mousedown="onMouseDown"
    ></div>
    
    <div 
      ref="rightPane" 
      class="split-pane-right overflow-hidden"
    >
      <slot name="right"></slot>
    </div>
  </div>
</template>

<style scoped>
.split-pane-container {
  position: relative;
}

.split-pane-divider {
  cursor: col-resize;
  user-select: none;
  z-index: 10;
}

.split-pane-left, .split-pane-right {
  overflow: hidden;
}
</style>
