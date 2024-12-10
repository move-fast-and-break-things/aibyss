import { expect, test } from "@nuxt/test-utils/playwright";

test.setTimeout(60000);

const TEST_USERNAME = "testovich";
const TEST_PASSWORD = "best password ever";

test("user is being redirected to the login page if not authorized", async ({ page, goto }) => {
  await goto("/", { waitUntil: "hydration" });

  const pageUrl = new URL(page.url());
  expect(pageUrl.pathname).toEqual("/login");
});

test("user can log in", async ({ page, goto }) => {
  await goto("/login", { waitUntil: "hydration" });

  await page.fill("input[name=\"username\"]", TEST_USERNAME);
  await page.fill("input[name=\"password\"]", TEST_PASSWORD);
  await page.click("button[type=\"submit\"]");

  await page.waitForURL("/", { waitUntil: "networkidle" });

  const pageUrl = new URL(page.url());
  expect(pageUrl.pathname).toEqual("/");

  await page.waitForSelector(`[data-testid="code-editor"]`);
  await page.waitForSelector(`[data-testid="game-screen"]`);
});
