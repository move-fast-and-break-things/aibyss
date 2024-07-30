import { it, expect } from "vitest";
import prepareBotCode from "./prepareBotCode";

it("prepares bot code correctly when there is one bot in the world", () => {
  const bot = {
    id: "1",
    code: "console.log('hello world');",
  };

  const state = {
    bots: new Map([["1", { x: 0, y: 0, radius: 5, botId: "1", color: "#00FF00", spawnId: "s1" }]]),
    food: [],
    width: 100,
    height: 100,
  };

  const botApi = "console.log('hello bot api');";

  const preparedCode = prepareBotCode({ bot, state, botApi });

  expect(preparedCode).toMatchSnapshot();
});

it("prepares bot code correctly when there are two bots in the world", () => {
  const bot = {
    id: "1",
    code: "console.log('hello world');",
  };

  const state = {
    bots: new Map([
      ["1", { x: 0, y: 0, radius: 5, botId: "1", color: "#00FF00", spawnId: "s1" }],
      ["2", { x: 10, y: 10, radius: 5, botId: "2", color: "#00FF00", spawnId: "s2" }],
    ]),
    food: [],
    width: 100,
    height: 100,
  };

  const botApi = "console.log('hello bot api');";

  const preparedCode = prepareBotCode({ bot, state, botApi });

  expect(preparedCode).toMatchSnapshot();
});

it("prepares bot code correctly when there are three bots and some food in the world", () => {
  const bot = {
    id: "1",
    code: "console.log('hello world');",
  };

  const state = {
    bots: new Map([
      ["1", { x: 0, y: 0, radius: 5, botId: "1", color: "#00FF00", spawnId: "s1" }],
      ["2", { x: 10, y: 10, radius: 5, botId: "2", color: "#00FF00", spawnId: "s2" }],
      ["3", { x: 20, y: 20, radius: 5, botId: "3", color: "#00FF00", spawnId: "s3" }],
    ]),
    food: [{ x: 30, y: 30, radius: 5 }, { x: 40, y: 40, radius: 5 }],
    width: 100,
    height: 100,
  };

  const botApi = "console.log('hello bot api');";

  const preparedCode = prepareBotCode({ bot, state, botApi });

  expect(preparedCode).toMatchSnapshot();
});
