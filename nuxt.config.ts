// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "Aibyss",
    },
  },
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  modules: ["nuxt-monaco-editor", "@nuxt/eslint"],
  nitro: {
    hooks: {
      "dev:reload": () => require("isolated-vm"),
    },
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  typescript: {
    typeCheck: true,
    strict: true,
  },
  eslint: {
    config: {
      stylistic: {
        indent: 2,
        quotes: "double",
        semi: true,
        arrowParens: false,
        braceStyle: "1tbs",
        blockSpacing: true,
      },
    },
  },
});
