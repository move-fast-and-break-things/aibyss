// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    "curly": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
  },
});
