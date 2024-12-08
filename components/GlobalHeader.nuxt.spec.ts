import { mountSuspended } from "@nuxt/test-utils/runtime";

import { it, expect } from "vitest";

import GlobalHeader from "./GlobalHeader.vue";

it("mounts the GlobalHeader component", async () => {
  const component = await mountSuspended(GlobalHeader);
  expect(component.text()).toEqual("Aibyss rating • ?");
});
