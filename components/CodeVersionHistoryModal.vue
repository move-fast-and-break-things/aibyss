<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  onClose: () => void;
}>();

const emit = defineEmits<{
  revert: [timestamp: number];
}>();

interface Version {
  timestamp: number;
  date: string;
  id: string;
}

const state = reactive({
  versions: [] as Version[],
  selectedVersion: null as Version | null,
  selectedVersionCode: "",
  loading: true,
  error: "",
});

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    try {
      state.loading = true;
      state.error = "";
      state.selectedVersion = null;
      state.selectedVersionCode = "";

      // Load versions list
      const response = await fetch("/api/bot/versions");
      if (!response.ok) {
        throw new Error("Failed to load versions");
      }

      state.versions = await response.json();
    } catch (error) {
      state.error = error instanceof Error ? error.message : "An error occurred";
    } finally {
      state.loading = false;
    }
  }
});

async function selectVersion(version: Version) {
  try {
    state.loading = true;
    state.error = "";
    state.selectedVersion = version;

    // Load selected version code
    const response = await fetch(`/api/bot/version/${version.timestamp}`);
    if (!response.ok) {
      throw new Error("Failed to load version");
    }

    const data = await response.json();
    state.selectedVersionCode = data.code;
  } catch (error) {
    state.error = error instanceof Error ? error.message : "An error occurred";
  } finally {
    state.loading = false;
  }
}

async function revertToVersion() {
  if (!state.selectedVersion) {
    return;
  }

  try {
    state.loading = true;
    state.error = "";

    // Revert to selected version
    const response = await fetch("/api/bot/version/revert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timestamp: state.selectedVersion.timestamp }),
    });

    if (!response.ok) {
      throw new Error("Failed to revert to version");
    }

    emit("revert", state.selectedVersion.timestamp);
    props.onClose();
  } catch (error) {
    state.error = error instanceof Error ? error.message : "An error occurred";
  } finally {
    state.loading = false;
  }
}
</script>

<template>
  <ModalDialog
    :open="open"
    :on-close="onClose"
    extra-modal-class="w-[900px]"
  >
    <div
      v-if="state.loading && !state.versions.length"
      class="flex flex-col h-full"
    >
      <div class="flex items-center justify-center h-full">
        <span>Loading versions...</span>
      </div>
    </div>

    <div
      v-else-if="state.error && !state.versions.length"
      class="flex flex-col h-full"
    >
      <div class="flex items-center justify-center h-full">
        <span class="text-red-500">{{ state.error }}</span>
      </div>
    </div>

    <div
      v-else-if="!state.versions.length"
      class="flex flex-col h-full"
    >
      <div class="flex items-center justify-center h-full">
        <span>No previous versions found.</span>
      </div>
    </div>

    <div
      v-else
      class="flex h-full"
    >
      <!-- Version code preview -->
      <div class="w-2/3 h-full pr-4 border-r">
        <div
          v-if="!state.selectedVersion"
          class="flex items-center justify-center h-full"
        >
          <span class="text-gray-500">Select a version to preview</span>
        </div>

        <div
          v-else-if="state.loading"
          class="flex items-center justify-center h-full"
        >
          <span>Loading code...</span>
        </div>

        <div
          v-else
          class="h-full flex flex-col"
        >
          <div class="flex justify-between mb-2">
            <h3 class="font-medium">
              Version from {{ state.selectedVersion.date }}
            </h3>
            <button
              class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white"
              @click="revertToVersion"
            >
              Restore this version
            </button>
          </div>
          <MonacoEditor
            v-model="state.selectedVersionCode"
            lang="javascript"
            class="flex-grow"
            :options="{
              readOnly: true,
              scrollBeyondLastLine: false,
              minimap: { enabled: false },
              smoothScrolling: true,
            }"
          />
        </div>
      </div>

      <!-- Versions list -->
      <div class="w-1/3 h-full pl-4 overflow-y-auto">
        <h3 class="font-medium mb-3">
          Code history
        </h3>

        <div
          v-if="state.error"
          class="text-red-500 mb-3"
        >
          {{ state.error }}
        </div>

        <ul class="space-y-2">
          <li
            v-for="version in state.versions"
            :key="version.timestamp"
            class="p-2 border cursor-pointer hover:bg-gray-50"
            :class="{ 'bg-blue-50 border-blue-300': state.selectedVersion?.timestamp === version.timestamp }"
            @click="selectVersion(version)"
          >
            <div class="text-sm">
              {{ version.date }}
            </div>
          </li>
        </ul>
      </div>
    </div>
  </ModalDialog>
</template>
