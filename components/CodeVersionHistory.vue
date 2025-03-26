<script setup lang="ts">
import { CodeVersion } from "~/other/botCodeStore";

const props = defineProps<{
  versions: CodeVersion[];
  onClose: () => void;
  onRestore: (code: string) => void;
}>();

const selectedVersionIndex = ref(0);

const formattedVersions = computed(() => {
  return props.versions.map((version, index) => {
    const date = new Date(version.timestamp);
    return {
      ...version,
      formattedDate: date.toLocaleString(),
      isSelected: index === selectedVersionIndex.value
    };
  });
});

function selectVersion(index: number) {
  selectedVersionIndex.value = index;
}

function restoreSelectedVersion() {
  if (props.versions.length > 0) {
    props.onRestore(props.versions[selectedVersionIndex.value].code);
    props.onClose();
  }
}
</script>

<template>
  <div class="flex h-full">
    <!-- Left side: Code preview -->
    <div class="w-2/3 h-full pr-4">
      <MonacoEditor
        v-if="versions.length > 0"
        v-model="versions[selectedVersionIndex].code"
        lang="javascript"
        :options="{
          readOnly: true,
          readOnlyMessage: { value: 'Cannot edit version preview' },
          smoothScrolling: true,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
        }"
        class="h-full"
      />
      <div v-else class="flex items-center justify-center h-full bg-gray-100">
        <p class="text-gray-500">No previous versions found</p>
      </div>
    </div>
    
    <!-- Right side: Version list -->
    <div class="w-1/3 h-full overflow-y-auto border-l pl-4">
      <h3 class="text-lg font-semibold mb-4">Version History</h3>
      
      <div v-if="versions.length === 0" class="text-gray-500">
        No previous versions available
      </div>
      
      <ul v-else class="space-y-2">
        <li 
          v-for="(version, index) in formattedVersions" 
          :key="version.timestamp"
          @click="selectVersion(index)"
          :class="[
            'p-2 cursor-pointer rounded transition-colors',
            version.isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'
          ]"
        >
          <div class="font-medium">{{ version.formattedDate }}</div>
        </li>
      </ul>
      
      <div class="mt-6 flex justify-end">
        <button
          v-if="versions.length > 0"
          @click="restoreSelectedVersion"
          class="h-10 px-6 font-semibold shadow bg-black text-white hover:bg-gray-800 transition"
        >
          Restore This Version
        </button>
      </div>
    </div>
  </div>
</template>
