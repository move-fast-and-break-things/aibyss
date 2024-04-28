import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import type { ConfigOptions } from "@nuxt/test-utils/playwright";
import dotenv from "dotenv";

dotenv.config({ path: ".env.e2e" });

export default defineConfig<ConfigOptions>({
  use: {
    nuxt: {
      rootDir: fileURLToPath(new URL(".", import.meta.url)),
      build: true,
      server: true,
      browser: true,
      browserOptions: {
        type: "chromium",
      },
      runner: "vitest",
    },
  },
  globalSetup: fileURLToPath(new URL("tests/e2e/global-setup.ts", import.meta.url)),
  testDir: fileURLToPath(new URL("tests/e2e", import.meta.url)),
});
