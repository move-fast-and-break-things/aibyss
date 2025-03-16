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
  showVersionHistory: false,
  versions: [] as { filename: string; timestamp: number; code: string }[],
  selectedVersionCode: "",
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

async function onShowVersionHistoryClick() {
  state.showVersionHistory = true;
  const res = await fetch("/api/bot/history");
  const data = await res.json();
  state.versions = data.versions;
  if (state.versions.length > 0) {
    state.selectedVersionCode = state.versions[0].code;
  }
}

function onSelectVersion(version) {
  state.selectedVersionCode = version.code;
}

function onRestoreVersion() {
  state.code = state.selectedVersionCode;
  state.showVersionHistory = false;
}

function onCloseVersionHistoryModal() {
  state.showVersionHistory = false;
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
          <ButtonLink @click="onShowVersionHistoryClick">
            Version History
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
  <ModalDialog
    :open="state.showVersionHistory"
    :on-close="onCloseVersionHistoryModal"
    extra-modal-class="w-[800px]"
  >
    <div class="flex">
      <div class="w-1/2 pr-2">
        <MonacoEditor
          v-model="state.selectedVersionCode"
          lang="javascript"
          :options="{
            readOnly: true,
            lineNumbers: 'off',
            smoothScrolling: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
          }"
          class="h-full"
        />
      </div>
      <div class="w-1/2 pl-2">
        <ul>
          <li v-for="version in state.versions" :key="version.filename" class="mb-2">
            <div class="flex items-center justify-between">
              <span>{{ version.filename }}</span>
              <ButtonLink @click="onSelectVersion(version)">
                Preview
              </ButtonLink>
              <ButtonLink @click="onRestoreVersion">
                Restore
              </ButtonLink>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </ModalDialog>
</template>
