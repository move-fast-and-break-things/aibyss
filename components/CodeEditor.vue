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
const { data: gameState } = await useFetch("/api/state");

// Watch for errors in the game state
watch(() => gameState.value?.errorStack, (newErrorStack) => {
  if (newErrorStack) {
    state.executionError = newErrorStack;
  }
});

const state = reactive({
  code: user.value?.body.code || defaultCode,
  codeHasErrors: false,
  showAPIReference: false,
  executionError: null as string | null,
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

function dismissError() {
  state.executionError = null;
}
</script>

<template>
  <div
    class="w-full h-full font-sans flex flex-col"
    data-testid="code-editor"
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
          :class="{ 'h-[85%]': state.executionError }"
          :options="{
            smoothScrolling: true,
          }"
        />
        
        <!-- Error display -->
        <div v-if="state.executionError" class="border-t border-red-300 bg-red-50 text-red-800 p-4 max-h-[15%] overflow-auto relative">
          <button 
            @click="dismissError"
            class="absolute top-2 right-2 text-red-800 hover:text-red-900"
            title="Dismiss error"
          >
            ✕
          </button>
          <h3 class="font-bold text-sm mb-1">Bot Execution Error:</h3>
          <pre class="text-xs whitespace-pre-wrap overflow-x-auto font-mono">{{ state.executionError }}</pre>
        </div>
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
