import { describe, expect, it } from "vitest";
import { CodeRunner } from "./CodeRunner";

describe("CodeRunner", () => {
  it("can run code", async () => {
    const codeRunner = new CodeRunner();
    const result = await codeRunner.runCode("1 + 1");
    expect(result).toEqual(2);
  });

  it("can return stringified objects", async () => {
    const codeRunner = new CodeRunner();
    const result = await codeRunner.runCode("JSON.stringify({ a: 1, b: 2 })");
    expect(JSON.parse(result)).toEqual({ a: 1, b: 2 });
  });

  it("can access Math object", async () => {
    const codeRunner = new CodeRunner();
    const result = await codeRunner.runCode("Math.sqrt(4)");
    expect(result).toEqual(2);
  });

  it("crashes if the code throws an exception", async () => {
    const codeRunner = new CodeRunner();
    expect(() => codeRunner.runCode(`(() => { throw Error("I am a test exception") })()`))
      .rejects
      .toThrow("I am a test exception");
  });

  it("can't access the `window` object", async () => {
    const codeRunner = new CodeRunner();
    expect(() => codeRunner.runCode("JSON.stringify(window.location)"))
      .rejects
      .toThrow("window is not defined");
  });

  it("crashes if the code consumes too much memory", async () => {
    const codeRunner = new CodeRunner();
    expect(() => {
      return codeRunner.runCode(`
        const array = new Array(70 * 1024 * 1024 / 4);
        array.fill(0);
      `);
    }).rejects.toThrow("Isolate was disposed during execution due to memory limit");
  });

  it("crashes if the code runs for too long", async () => {
    const codeRunner = new CodeRunner();
    expect(() => codeRunner.runCode("while (true) {}"))
      .rejects
      .toThrow("Script execution timed out");
  });

  it("code can't access variables created by previously executed code", async () => {
    const codeRunner = new CodeRunner();
    const result = await codeRunner.runCode("const a = 39; a");
    expect(result).toEqual(39);
    expect(() => codeRunner.runCode("a"))
      .rejects
      .toThrow("a is not defined");
  });

  it("can't call `fetch`", async () => {
    const codeRunner = new CodeRunner();
    expect(() => codeRunner.runCode("fetch('https://example.com')"))
      .rejects
      .toThrow("fetch is not defined");
  });

  it("modifications to the `Array` prototype don't leak between runs and outside of an isolate", async () => {
    const codeRunner = new CodeRunner();
    const result1 = await codeRunner.runCode("Array.prototype.foo = 42; [].foo");
    expect(result1).toBe(42);
    const result2 = await codeRunner.runCode("[].foo");
    expect(result2).toBeUndefined();
    // @ts-expect-error - we're testing a property that doesn't exist on the Array prototype
    expect([].foo).toBeUndefined();
  });

  it("can run multiple scripts in parallel", async () => {
    const scripts: string[] = [];
    for (let i = 0; i < 10; i++) {
      scripts.push(`for (let i = 0; i < 10_000_000; ++i) {}; 1 + ${i}`);
    }
    const codeRunner = new CodeRunner();
    const results = await Promise.all(scripts.map(script => codeRunner.runCode(script)));
    expect(results).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});
