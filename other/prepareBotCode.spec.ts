import { it, expect } from "vitest";
import prepareBotCode from "./prepareBotCode";

it("prepares bot code correctly when there is one bot in the world", () => {
  const bot = {
    id: "1",
    code: "console.log('hello world');",
    username: "yurij",
    userId: 1,
  };

  const botCodes = { 1: bot };

  const state = {
    bots: new Map([["1", { x: 0, y: 0, radius: 5, botId: "1", color: "#00FF00", spawnId: "s1" }]]),
    food: [],
    width: 100,
    height: 100,
  };

  const botApi = "console.log('hello bot api');";

  const preparedCode = prepareBotCode({ bot, botInfo: botCodes, state, prevState: state, botApi });

  expect(preparedCode).toMatchSnapshot();
});

it("prepares bot code correctly when there are two bots in the world", () => {
  const bot = {
    id: "1",
    code: "console.log('hello world');",
    username: "yurij",
    userId: 1,
  };

  const botCodes = {
    1: bot,
    2: {
      id: "2",
      code: "console.log('hello world');",
      username: "danil",
      userId: 2,
    },
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

  const preparedCode = prepareBotCode({ bot, botInfo: botCodes, state, prevState: state, botApi });

  expect(preparedCode).toMatchSnapshot();
});

it("prepares bot code correctly when there are three bots and some food in the world", () => {
  const bot = {
    id: "1",
    code: "console.log('hello world');",
    username: "yurij",
    userId: 1,
  };

  const botCodes = {
    1: bot,
    2: {
      id: "2",
      code: "console.log('hello world');",
      username: "danil",
      userId: 2,
    },
    3: {
      id: "3",
      code: "console.log('hello world');",
      username: "andrey",
      userId: 3,
    },
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

  const preparedCode = prepareBotCode({ bot, botInfo: botCodes, state, prevState: state, botApi });

  expect(preparedCode).toMatchSnapshot();
});

it("handles the case when the bot was not in the previous state", () => {
  const bot = {
    id: "1",
    code: "console.log('hello world');",
    username: "yurij",
    userId: 1,
  };

  const botCodes = {
    1: bot,
    2: {
      id: "2",
      code: "console.log('hello world');",
      username: "danil",
      userId: 2,
    },
    3: {
      id: "3",
      code: "console.log('hello world');",
      username: "andrey",
      userId: 3,
    },
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

  const previousState = {
    bots: new Map(),
    food: [],
  };

  const botApi = "console.log('hello bot api');";

  const preparedCode = prepareBotCode({ bot, botInfo: botCodes, state, prevState: previousState, botApi });

  expect(preparedCode).toMatchSnapshot();
});

it("correctly saves values for a different previous state", () => {
  const bot = {
    id: "1",
    code: "console.log('hello world');",
    username: "yurij",
    userId: 1,
  };

  const botCodes = {
    1: bot,
    2: {
      id: "2",
      code: "console.log('hello world');",
      username: "danil",
      userId: 2,
    },
    3: {
      id: "3",
      code: "console.log('hello world');",
      username: "andrey",
      userId: 3,
    },
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

  const previousState = {
    bots: new Map([
      ["1", { x: 2, y: 4, radius: 3, botId: "1", color: "#00FF00", spawnId: "s1" }],
      ["2", { x: 11, y: 12, radius: 4, botId: "2", color: "#00FF00", spawnId: "s2" }],
      ["3", { x: 22, y: 40, radius: 5, botId: "3", color: "#00FF00", spawnId: "s3" }],
    ]),
    food: [{ x: 3, y: 3, radius: 2 }, { x: 30, y: 30, radius: 5 }, { x: 40, y: 40, radius: 5 }],
  };

  const botApi = "console.log('hello bot api');";

  const preparedCode = prepareBotCode({ bot, botInfo: botCodes, state, prevState: previousState, botApi });

  expect(preparedCode).toMatchSnapshot();
});
