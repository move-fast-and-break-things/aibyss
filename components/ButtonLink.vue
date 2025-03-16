<script setup lang="ts">
const props = defineProps({
  type: {
    type: String,
    default: 'button'
  }
});
</script>

<template>
  <button :type="type" class="text-indigo-600 hover:text-indigo-400" v-bind="$attrs">
    <slot />
  </button>
</template>
