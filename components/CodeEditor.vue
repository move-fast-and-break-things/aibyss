<script setup lang="ts">
import { defaultCode, jsdoc } from "~/other/defaultCode.js";

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

const SPLITTER_WIDTH = 8;
const DEFAULT_SPLITTER_POSITION = 50;

const state = reactive({
  code: user.value?.body.code || defaultCode,
  codeHasErrors: false,
  showAPIReference: false,
  splitterPosition: Number(localStorage.getItem('splitterPosition')) || DEFAULT_SPLITTER_POSITION,
  isDraggingSplitter: false
});

function handleSplitterMouseDown(event: MouseEvent) {
  state.isDraggingSplitter = true;
  document.addEventListener('mousemove', handleSplitterMouseMove);
  document.addEventListener('mouseup', handleSplitterMouseUp);
}

function handleSplitterMouseMove(event: MouseEvent) {
  if (!state.isDraggingSplitter) return;
  
  const container = document.querySelector('.split-container');
  if (!container) return;
  
  const rect = container.getBoundingClientRect();
  const newPosition = ((event.clientX - rect.left) / rect.width) * 100;
  state.splitterPosition = Math.max(25, Math.min(75, newPosition));
  localStorage.setItem('splitterPosition', state.splitterPosition.toString());
}

function handleSplitterMouseUp() {
  state.isDraggingSplitter = false;
  document.removeEventListener('mousemove', handleSplitterMouseMove);
  document.removeEventListener('mouseup', handleSplitterMouseUp);
}

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
    class="w-full h-full font-sans flex"
    data-testid="code-editor"
    :style="{ cursor: state.isDraggingSplitter ? 'col-resize' : 'default' }"
  >
    <div 
      class="split-container flex-grow h-full relative"
      :style="{ flexBasis: `${state.splitterPosition}%` }"
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
    </div>
    <div
      class="splitter bg-gray-200 hover:bg-gray-300 transition-colors w-2 cursor-col-resize relative"
      @mousedown="handleSplitterMouseDown"
      :style="{ 
        left: `-${SPLITTER_WIDTH/2}px`,
        width: `${SPLITTER_WIDTH}px`,
        backgroundColor: state.isDraggingSplitter ? '#9CA3AF' : '#E5E7EB'
      }"
    ></div>
    <div class="game-screen-container flex-grow h-full">
      <GameScreen />
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
