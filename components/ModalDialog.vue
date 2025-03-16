<script setup lang="ts">
const { open, onClose, extraModalClass } = defineProps<{ open: boolean; onClose: () => void; extraModalClass?: string }>();
</script>

<template>
  <div
    v-if="open"
    class="flex absolute z-10 w-full h-full top-0 left-0 bg-slate-400 bg-opacity-20 items-center justify-center"
    @click.self="onClose"
  >
    <div :class="`bg-white z-10 flex flex-col max-w-xl max-h-[calc(100vh-140px)] h-[600px] shadow p-4 pt-2 mb-16 ${extraModalClass}`">
      <div class="flex flex-row justify-end mb-2">
        <ButtonLink @click="onClose">
          close
        </ButtonLink>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const { open, onClose, extraModalClass } = defineProps<{ 
  open: boolean; 
  onClose: () => void; 
  extraModalClass?: string;
  showSidebar?: boolean;
}>();

const slots = useSlots();
</script>

<style scoped>
.version-history-modal {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1rem;
}

.version-list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.version-item {
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.version-item:hover {
  background-color: #f5f5f5;
}

.version-item.selected {
  background-color: #e0f7fa;
}
</style>
