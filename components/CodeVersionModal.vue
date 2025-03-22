<template>
  <ModalDialog :open="true" :on-close="onClose" extra-modal-class="w-[80vw] h-[80vh]">
    <div class="flex h-full">
      <div class="w-2/3 border-r p-4">
        <MonacoEditor
          v-model="previewCode"
          lang="javascript"
          :options="{
            readOnly: true,
            readOnlyMessage: { value: 'This version is read-only' },
            lineNumbers: 'off',
            smoothScrolling: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
          }"
          class="h-full"
        />
      </div>
      <div class="w-1/3 p-4 flex flex-col">
        <div class="flex-grow overflow-y-auto">
          <ul>
            <li
              v-for="version in versions"
              :key="version.filename"
              class="border p-2 my-1 cursor-pointer hover:bg-gray-100"
              @click="selectVersion(version)"
            >
              <div>{{ version.filename }}</div>
              <div class="text-sm text-gray-600">{{ formatTimestamp(version.timestamp) }}</div>
            </li>
          </ul>
        </div>
        <div class="mt-4">
          <button
            @click="restoreVersion"
            class="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
            :disabled="!previewCode"
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
const emit = defineEmits<{
  (e: "close"): void;
  (e: "revert", code: string): void;
}>();

const versions = ref<Array<{ filename: string; timestamp: number; code: string }>>([]);
const previewCode = ref("");

// Fetch versions from an API endpoint on mount
onMounted(async () => {
  try {
    const res = await fetch("/api/bot/versions");
    const data = await res.json();
    versions.value = data.versions;
    if (versions.value.length > 0) {
      previewCode.value = versions.value[0].code;
    }
  } catch (e) {
    console.error("Failed to fetch code versions", e);
  }
});

function selectVersion(version: { filename: string; timestamp: number; code: string }) {
  previewCode.value = version.code;
}

function restoreVersion() {
  emit("revert", previewCode.value);
}

function onClose() {
  emit("close");
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}
</script>
