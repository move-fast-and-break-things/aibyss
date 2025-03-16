<script setup lang="ts">
import { defaultCode, jsdoc } from "~/other/defaultCode.js";
import { ref, onMounted } from 'vue';

const SPLITTER_WIDTH = 8;
const MIN_PANEL_WIDTH = 300;
const SPLITTER_KEY = 'codeEditorSplitterPosition';

const splitterPosition = ref(50);
const isDragging = ref(false);

function startDrag() {
  isDragging.value = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function stopDrag() {
  isDragging.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

function handleDrag(event: MouseEvent) {
  if (isDragging.value) {
    const container = document.querySelector('.editor-container');
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const newPosition = ((event.clientX - containerRect.left) / containerRect.width) * 100;
      splitterPosition.value = Math.max(
        MIN_PANEL_WIDTH / containerRect.width * 100,
        Math.min(100 - (MIN_PANEL_WIDTH / containerRect.width * 100), newPosition)
      );
      localStorage.setItem(SPLITTER_KEY, splitterPosition.value.toString());
    }
  }
}

onMounted(() => {
  const savedPosition = localStorage.getItem(SPLITTER_KEY);
  if (savedPosition) {
    splitterPosition.value = parseFloat(savedPosition);
  }
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
});

if (import.meta.client) {
  // configure monaco editor on client side
  // because we can't import monaco on server side
  const monaco = await import("monaco-editor");

  // enable type & syntax checking
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    ...monaco.languages.typescript.javascriptDefaults.getDiagnosticsOptions(),
    noSemanticValidation: false,
    noSuggestionDiagnostics: false,
    noSyntaxValidation: false,
  });
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    ...monaco.languages.typescript.javascriptDefaults.getCompilerOptions(),
    checkJs: true,
  });

  // add JSDoc so the autocompletion always works
  monaco.languages.typescript.javascriptDefaults.addExtraLib(jsdoc);

  monaco.editor.onDidChangeMarkers(() => {
    const modelMarkers = monaco.editor.getModelMarkers({});
    state.codeHasErrors = modelMarkers.some(marker => marker.severity === monaco.MarkerSeverity.Error);
  });
}

const { data: user } = await useFetch("/api/auth/user");

const state = reactive({
  code: user.value?.body.code || defaultCode,
  codeHasErrors: false,
  showAPIReference: false,
});

function onSubmit(event: Event) {
  event.preventDefault();
  fetch("/api/bot/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: state.code }),
  });
}

function onRestoreDefaultCodeClick() {
  state.code = defaultCode;
}

function onShowAPIReferenceClick() {
  state.showAPIReference = true;
}

function onCloseAPIReferenceModal() {
  state.showAPIReference = false;
}
</script>

<template>
  <div
    class="editor-container w-full h-full font-sans flex"
    data-testid="code-editor"
  >
    <div
      class="h-full"
      :style="{ width: `${splitterPosition}%` }"
    >
    <form
      class="flex flex-grow flex-col"
      @submit="onSubmit"
    >
      <div class="flex flex-grow flex-col shadow mb-4">
        <div class="flex flex-row justify-end mb-2 mt-1 mx-2 gap-6">
          <ButtonLink @click="onRestoreDefaultCodeClick">
            restore example code
          </ButtonLink>
          <ButtonLink @click="onShowAPIReferenceClick">
            API reference
          </ButtonLink>
        </div>
        <MonacoEditor
          v-model="state.code"
          lang="javascript"
          class="flex-grow"
          :options="{
            smoothScrolling: true,
          }"
        />
      </div>
      <div class="flex justify-end">
        <button
          type="submit"
          class="h-10 px-6 font-semibold shadow bg-black text-white hover:bg-gray-800 transition disabled:opacity-50 disabled:bg-black disabled:cursor-not-allowed"
          :title="state.codeHasErrors ? 'Fix errors in the code to submit' : undefined"
          :disabled="state.codeHasErrors"
        >
          Submit
        </button>
      </div>
    </form>
    </div>
    <div
      class="splitter bg-gray-200 hover:bg-gray-400 cursor-col-resize"
      :style="{ width: `${SPLITTER_WIDTH}px` }"
      @mousedown="startDrag"
    ></div>
  </div>
  <ModalDialog
    :open="state.showAPIReference"
    :on-close="onCloseAPIReferenceModal"
    extra-modal-class="w-[540px]"
  >
    <MonacoEditor
      v-model="jsdoc"
      lang="javascript"
      :options="{
        readOnly: true,
        readOnlyMessage: { value: 'Cannot edit API reference' },
        lineNumbers: 'off',
        smoothScrolling: true,
        scrollBeyondLastLine: false,
        minimap: { enabled: false },
      }"
      class="flex-grow"
    />
  </ModalDialog>
</template>
