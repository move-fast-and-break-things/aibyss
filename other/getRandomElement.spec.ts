import { it, expect } from "vitest";
import getRandomElement from "./getRandomElement";

it("returns a random element from the array", () => {
  const array = [1, 2, 3, 4, 5];
  const randomElement = getRandomElement(array);

  expect(array).toContain(randomElement.element);
});

it("throws an error if the array is empty", () => {
  const array: number[] = [];

  expect(() => getRandomElement(array)).toThrowError("Array is empty");
});

it("returns a random element from Uint32Array", () => {
  const array = new Uint32Array([1, 2, 3, 4, 5]);
  const { element, idx } = getRandomElement(array);

  expect(array).toContain(element);
  expect(idx).toBeLessThan(array.length);
});
