<script setup lang="ts">
const { open, onClose, extraModalClass } = defineProps<{ open: boolean; onClose: () => void; extraModalClass?: string }>();
</script>

<template>
  <div
    v-if="open"
    class="flex absolute z-10 w-full h-full top-0 left-0 bg-slate-400 bg-opacity-20 items-center justify-center"
    @click.self="onClose"
  >
    <div :class="`bg-white z-10 flex flex-col max-h-[calc(100vh-140px)] h-auto shadow p-4 pt-2 mb-16 ${extraModalClass}`">
      <div class="flex flex-row justify-end mb-2">
        <ButtonLink @click="onClose">
          close
        </ButtonLink>
      </div>
      <slot />
    </div>
  </div>
</template>
