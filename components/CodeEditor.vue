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

const state = reactive({
  code: user.value?.body.code || defaultCode,
  codeHasErrors: false,
  showAPIReference: false,
  botError: null as string | null,
  isErrorVisible: false,
});

const { data: gameState } = await useFetch("/api/state");

watch(gameState, (newState) => {
  if (newState?.errorStack) {
    state.botError = newState.errorStack;
    state.isErrorVisible = true;
  }
});

function dismissError() {
  state.isErrorVisible = false;
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
          :options="{
            smoothScrolling: true,
          }"
        />
      </div>
      <div class="flex flex-col gap-4">
        <div
          v-if="state.isErrorVisible && state.botError"
          class="relative bg-red-50 border border-red-200 rounded p-4"
        >
          <button
            @click="dismissError"
            class="absolute top-2 right-2 text-red-500 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          <div class="text-red-600 font-mono text-sm overflow-auto max-h-40">
            {{ state.botError }}
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
