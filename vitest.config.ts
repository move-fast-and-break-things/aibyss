import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    alias: [
      {
        find: /^monaco-editor$/,
        replacement:
          __dirname + "/node_modules/monaco-editor/esm/vs/editor/editor.api",
      },
    ],
  },
});
