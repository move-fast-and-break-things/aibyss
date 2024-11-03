<script setup lang="ts">
const { open, onClose } = defineProps<{ open: boolean; onClose: () => void }>();
</script>

<template>
  <div
    v-if="open"
    class="absolute z-10 w-full h-full top-0 left-0 bg-slate-400 bg-opacity-20"
    @click.self="onClose"
  >
    <div class="bg-white z-10 flex flex-col max-w-xl max-h-[calc(100vh-140px)] h-[600px] shadow p-4 pt-2 mx-auto mt-[110px]">
      <div class="flex flex-row justify-end mb-2">
        <ButtonLink @click="onClose">
          close
        </ButtonLink>
      </div>
      <slot />
    </div>
  </div>
</template>
