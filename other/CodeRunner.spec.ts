import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeRunner } from "./CodeRunner";
import { prepareBotCode, prepareBotState } from "./prepareBotCode";

const MEMORY_BOMB = `
  const array = new Array(70 * 1024 * 1024 / 4);
  array.fill(0);
`;

describe("CodeRunner", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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
    await expect(() => codeRunner.runCode(`(() => { throw Error("I am a test exception") })()`))
      .rejects
      .toThrow("I am a test exception");
  });

  it("can't access the `window` object", async () => {
    const codeRunner = new CodeRunner();
    await expect(() => codeRunner.runCode("JSON.stringify(window.location)"))
      .rejects
      .toThrow("window is not defined");
  });

  it("crashes if the code consumes too much memory", async () => {
    const codeRunner = new CodeRunner();
    await expect(() => {
      return codeRunner.runCode(MEMORY_BOMB);
    }).rejects.toThrow("Isolate was disposed during execution due to memory limit");
  });

  it("recovers after the isolate is disposed due to the memory limit", async () => {
    const codeRunner = new CodeRunner();
    await expect(() => codeRunner.runCode(MEMORY_BOMB))
      .rejects
      .toThrow("Isolate was disposed during execution due to memory limit");
    const result = await codeRunner.runCode("1 + 1");
    expect(result).toEqual(2);
  });

  it("doesn't recreate the disposed isolate more often than once a minute", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const codeRunner = new CodeRunner();

    await expect(() => codeRunner.runCode(MEMORY_BOMB)).rejects.toThrow("memory limit");
    expect(await codeRunner.runCode("1 + 1")).toEqual(2);

    await expect(() => codeRunner.runCode(MEMORY_BOMB)).rejects.toThrow("memory limit");
    // within the cooldown the run is skipped instead of recreating the isolate
    expect(await codeRunner.runCode("1 + 1")).toBeUndefined();

    vi.advanceTimersByTime(60_000);
    expect(await codeRunner.runCode("1 + 1")).toEqual(2);
  });

  it("dispose() doesn't throw when the isolate is already disposed due to the memory limit", async () => {
    const codeRunner = new CodeRunner();
    await expect(() => codeRunner.runCode(MEMORY_BOMB)).rejects.toThrow("memory limit");
    codeRunner.dispose();
    await expect(() => codeRunner.runCode("1 + 1"))
      .rejects
      .toThrow("CodeRunner was disposed, create a new instance to run code");
  });

  it("throws after an explicit dispose", async () => {
    const codeRunner = new CodeRunner();
    codeRunner.dispose();
    await expect(() => codeRunner.runCode("1 + 1"))
      .rejects
      .toThrow("CodeRunner was disposed, create a new instance to run code");
  });

  it("crashes if the code runs for too long", async () => {
    const codeRunner = new CodeRunner();
    await expect(() => codeRunner.runCode("while (true) {}"))
      .rejects
      .toThrow("Script execution timed out");
  });

  it("code can't access variables created by previously executed code", async () => {
    const codeRunner = new CodeRunner();
    const result = await codeRunner.runCode("const a = 39; a");
    expect(result).toEqual(39);
    await expect(() => codeRunner.runCode("a"))
      .rejects
      .toThrow("a is not defined");
  });

  it("can't call `fetch`", async () => {
    const codeRunner = new CodeRunner();
    await expect(() => codeRunner.runCode("fetch('https://example.com')"))
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

  it("keeps working after recycle()", async () => {
    const codeRunner = new CodeRunner();
    expect(await codeRunner.runCode("1 + 1")).toEqual(2);
    codeRunner.recycle();
    expect(await codeRunner.runCode("2 + 2")).toEqual(4);
  });

  it("needsRecycle() is false for a fresh runner and stays false after the isolate is disposed", async () => {
    const codeRunner = new CodeRunner();
    expect(codeRunner.needsRecycle()).toBe(false);
    await expect(() => codeRunner.runCode(MEMORY_BOMB))
      .rejects
      .toThrow("Isolate was disposed during execution due to memory limit");
    // a disposed isolate is recovered lazily on the next run (throttled), not via recycle()
    expect(codeRunner.needsRecycle()).toBe(false);
    expect(await codeRunner.runCode("1 + 1")).toEqual(2);
  });

  it("runScript() passes the state to the script", async () => {
    const codeRunner = new CodeRunner();
    const result = await codeRunner.runScript({ cacheKey: "bot-1", code: "JSON.parse(globalThis._stateJson).x * 2", stateJson: JSON.stringify({ x: 21 }) });
    expect(result).toEqual(42);
  });

  it("runScript() reuses the compiled script and picks up fresh state", async () => {
    const codeRunner = new CodeRunner();
    const code = "JSON.parse(globalThis._stateJson).x + 1";
    expect(await codeRunner.runScript({ cacheKey: "bot-1", code, stateJson: JSON.stringify({ x: 1 }) })).toEqual(2);
    expect(await codeRunner.runScript({ cacheKey: "bot-1", code, stateJson: JSON.stringify({ x: 2 }) })).toEqual(3);
  });

  it("runScript() recompiles when the code changes", async () => {
    const codeRunner = new CodeRunner();
    expect(await codeRunner.runScript({ cacheKey: "bot-1", code: "1 + 1", stateJson: "{}" })).toEqual(2);
    expect(await codeRunner.runScript({ cacheKey: "bot-1", code: "2 + 2", stateJson: "{}" })).toEqual(4);
  });

  it("runScript() runs cached scripts in a fresh context every time", async () => {
    const codeRunner = new CodeRunner();
    const code = "globalThis._y = (globalThis._y ?? 0) + 1; globalThis._y";
    expect(await codeRunner.runScript({ cacheKey: "bot-1", code, stateJson: "{}" })).toEqual(1);
    expect(await codeRunner.runScript({ cacheKey: "bot-1", code, stateJson: "{}" })).toEqual(1);
  });

  it("runScript() caches scripts per key", async () => {
    const codeRunner = new CodeRunner();
    expect(await codeRunner.runScript({ cacheKey: "bot-1", code: "1 + 1", stateJson: "{}" })).toEqual(2);
    expect(await codeRunner.runScript({ cacheKey: "bot-2", code: "2 + 2", stateJson: "{}" })).toEqual(4);
    expect(await codeRunner.runScript({ cacheKey: "bot-1", code: "1 + 1", stateJson: "{}" })).toEqual(2);
  });

  it("runScript() keeps working after clearScripts()", async () => {
    const codeRunner = new CodeRunner();
    expect(await codeRunner.runScript({ cacheKey: "bot-1", code: "1 + 1", stateJson: "{}" })).toEqual(2);
    codeRunner.clearScripts();
    expect(await codeRunner.runScript({ cacheKey: "bot-1", code: "1 + 1", stateJson: "{}" })).toEqual(2);
  });

  it("runScript() runs code prepared by prepareBotCode with the same globals as before", async () => {
    const bot = { id: "1", code: "globalThis._seen = globalThis._player.x;", username: "yurij", userId: 1 };
    const botApi = "JSON.stringify({ seen: globalThis._seen, food: globalThis._food.length, stateJsonLeaks: typeof globalThis._stateJson !== 'undefined' })";
    const code = prepareBotCode({ bot, botApi });

    const state = {
      bots: new Map([["1", { x: 7, y: 0, radius: 5, botId: "1", color: "#00FF00", spawnId: "s1" }]]),
      food: [{ x: 30, y: 30, radius: 5 }],
      width: 100,
      height: 100,
    };
    const stateJson = prepareBotState({ bot, botInfo: { 1: bot }, state, prevBotState: state.bots });

    const codeRunner = new CodeRunner();
    const firstRun = JSON.parse(await codeRunner.runScript({ cacheKey: bot.id, code, stateJson }));
    const secondRun = JSON.parse(await codeRunner.runScript({ cacheKey: bot.id, code, stateJson }));
    expect(firstRun).toEqual({ seen: 7, food: 1, stateJsonLeaks: false });
    expect(secondRun).toEqual(firstRun);
  });
});
