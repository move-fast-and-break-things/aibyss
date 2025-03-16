<template>
  <a class="text-indigo-600 hover:text-indigo-400" :href="href" @click.prevent="$emit('click', $event)">
    <slot />
  </a>

<script setup lang="ts">
defineProps<{
  href: string
}>();
defineEmits(['click']);
</script>
</template>
