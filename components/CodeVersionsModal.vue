<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { BotCodeVersion } from '~/other/botCodeStore';

const props = defineProps<{
  open: boolean;
  onClose: () => void;
}>();

const emit = defineEmits<{
  (e: 'restore', code: string): void;
}>();

const versions = ref<BotCodeVersion[]>([]);
const selectedVersion = ref<BotCodeVersion | null>(null);
const selectedVersionCode = ref<string>('');
const loading = ref(true);

async function loadVersions() {
  loading.value = true;
  try {
    const response = await fetch('/api/bot/versions');
    if (response.ok) {
      const data = await response.json();
      versions.value = data.versions;
      
      if (versions.value.length > 0) {
        selectedVersion.value = versions.value[0];
        selectedVersionCode.value = versions.value[0].code;
      }
    }
  } catch (error) {
    console.error('Error loading code versions:', error);
  } finally {
    loading.value = false;
  }
}

function selectVersion(version: BotCodeVersion) {
  selectedVersion.value = version;
  selectedVersionCode.value = version.code;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

function restoreVersion() {
  if (selectedVersion.value) {
    emit('restore', selectedVersion.value.code);
    props.onClose();
  }
}

onMounted(() => {
  if (props.open) {
    loadVersions();
  }
});

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    loadVersions();
  }
});
</script>

<template>
  <ModalDialog
    :open="open"
    :on-close="onClose"
    extra-modal-class="w-[900px] h-[600px]"
  >
    <div class="flex flex-col h-full">
      <h2 class="text-xl font-bold mb-4">Code Versions</h2>
      
      <div v-if="loading" class="flex-grow flex items-center justify-center">
        <p>Loading versions...</p>
      </div>
      
      <div v-else-if="versions.length === 0" class="flex-grow flex items-center justify-center">
        <p>No previous versions found</p>
      </div>
      
      <div v-else class="flex flex-row gap-4 h-[calc(100%-60px)]">
        <!-- Left side: Code preview -->
        <div class="w-3/5 h-full">
          <MonacoEditor
            v-model="selectedVersionCode"
            lang="javascript"
            class="h-full"
            :options="{
              readOnly: true,
              scrollBeyondLastLine: false,
              minimap: { enabled: false },
              smoothScrolling: true,
            }"
          />
        </div>
        
        <!-- Right side: Versions list -->
        <div class="w-2/5 h-full flex flex-col">
          <div class="overflow-y-auto flex-grow border border-gray-200">
            <div
              v-for="version in versions"
              :key="version.versionId"
              class="p-3 border-b cursor-pointer hover:bg-gray-100 transition"
              :class="{ 'bg-gray-100': selectedVersion?.versionId === version.versionId }"
              @click="selectVersion(version)"
            >
              <div class="font-medium">{{ formatDate(version.timestamp) }}</div>
              <div class="text-sm text-gray-600">{{ version.versionId }}</div>
            </div>
          </div>
          
          <div class="mt-4 flex justify-end">
            <button
              class="h-10 px-6 font-semibold shadow bg-black text-white hover:bg-gray-800 transition"
              @click="restoreVersion"
              :disabled="!selectedVersion"
            >
              Restore This Version
            </button>
          </div>
        </div>
      </div>
    </div>
  </ModalDialog>
</template>
