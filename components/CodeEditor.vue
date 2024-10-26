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
  intervalSubmit: false,
});

const buttonText = ref("Submit");

function onSubmit(event: Event) {
  event.preventDefault();
  fetch("/api/bot/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: state.code }),
  });

  state.intervalSubmit = true;
  let countdown = 4;

  const timer = setInterval(() => {
    buttonText.value = `${countdown.toFixed(1)}`;
    countdown -= 0.1;
    if (countdown < 0) {
      clearInterval(timer);
      buttonText.value = "Submit";
      state.intervalSubmit = false;
    }
  }, 100);
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
      <div class="flex justify-end">
        <button
          type="submit"
          class="h-10 px-6 font-semibold shadow bg-black text-white hover:bg-gray-800 transition disabled:opacity-50 disabled:bg-black disabled:cursor-not-allowed"
          :title="state.intervalSubmit ? `Wait for ${state.intervalSubmit} more seconds to submit the code again` : state.codeHasErrors ? 'Fix errors in the code to submit' : undefined"
          :disabled="state.codeHasErrors || state.intervalSubmit"
        >
          {{ buttonText }}
        </button>
      </div>
    </form>
  </div>
  <div
    v-if="state.showAPIReference"
    class="absolute z-10 w-full h-full top-0 left-0 bg-slate-400 bg-opacity-20"
    @click.self="onCloseAPIReferenceModal"
  >
    <div class="bg-white z-10 flex flex-col max-w-xl max-h-[calc(100vh-140px)] h-[600px] shadow p-4 pt-2 mx-auto mt-[110px]">
      <div class="flex flex-row justify-end mb-2">
        <ButtonLink @click="onCloseAPIReferenceModal">
          close
        </ButtonLink>
      </div>
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
    </div>
  </div>
</template>
