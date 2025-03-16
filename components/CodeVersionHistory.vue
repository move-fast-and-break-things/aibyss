<script setup lang="ts">
import { getBotVersions } from "~/other/botCodeStore";

const { data: user } = await useFetch("/api/auth/user");
const versions = ref<Array<{timestamp: number; code: string}>>([]);
const selectedCode = ref("");
const selectedTimestamp = ref<number | null>(null);

onMounted(async () => {
  if (user.value?.body.id) {
    versions.value = getBotVersions(user.value.body.id);
  }
});

function selectVersion(version: {timestamp: number; code: string}) {
  selectedCode.value = version.code;
  selectedTimestamp.value = version.timestamp;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

const emit = defineEmits(['restore', 'close']);

function onRestore() {
  emit('restore', selectedCode.value);
  emit('close');
}
</script>

<template>
  <div class="flex flex-col h-full">
    <h2 class="text-xl font-bold mb-4">Code Version History</h2>
    <div class="flex flex-grow gap-4">
      <div class="w-2/3">
        <MonacoEditor
          v-model="selectedCode"
          lang="javascript"
          :options="{
            readOnly: true,
            minimap: { enabled: false },
            lineNumbers: 'off'
          }"
          class="h-full border rounded"
        />
      </div>
      <div class="w-1/3 overflow-y-auto">
        <div 
          v-for="version in versions"
          :key="version.timestamp"
          @click="selectVersion(version)"
          class="p-2 border-b cursor-pointer hover:bg-gray-50"
          :class="{ 'bg-blue-50': selectedTimestamp === version.timestamp }"
        >
          <div class="font-medium">{{ formatDate(version.timestamp) }}</div>
          <div class="text-sm text-gray-500">
            {{ version.code.slice(0, 40) }}...
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button
        @click="$emit('close')"
        class="px-4 py-2 border rounded hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        @click="onRestore"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        :disabled="!selectedTimestamp"
      >
        Restore Version
      </button>
    </div>
  </div>
</template>
