import ivm from "isolated-vm";
import * as botUtils from "~/utils/botstore";
import World from "~/utils/world";

const MEMORY_LIMIT_MB = 64;
const TIME_LIMIT_MS = 100;

export const WORLD = new World ({ width: 600, height: 600 });

async function runBot(code: string) {
  const isolate = new ivm.Isolate({ memoryLimit: MEMORY_LIMIT_MB });
  const context = await isolate.createContext();
  const jail = context.global;
  await jail.set("global", jail.derefInto());
  const result = await context.eval(code, { timeout: TIME_LIMIT_MS });
  return JSON.parse(result);
}

type RunBotArgs = {
  bots: botUtils.Bots;
  world: World;
  botApi: string;
};

async function runBots({ bots, world, botApi }: RunBotArgs) {
  const state = world.getState();
  const botIds = Object.keys(bots);

  for (const botId of botIds) {
    if (!state.bots.get(botId)) {
      world.addBot(botId);
    }
  }

  for (const bot of Object.values(bots)) {
    const { code } = bot;

    const botObject = state.bots.get(bot.id);
    if (!botObject) {
      // TODO(yurij): add better logging
      console.error(`Bot with id ${bot.id} not found in the world`);
      continue;
    }

    const me = { x: botObject.x, y: botObject.y, radius: botObject.radius };
    const otherPlayers = Object.values(state.bots)
      .filter(b => b.id !== bot.id)
      .map(b => ({ x: b.x, y: b.y, radius: b.radius }));
    const food = state.food.map(f => ({ x: f.x, y: f.y, radius: f.radius }));

    try {
      const preparedCode = `
global._player = ${JSON.stringify(me)};
global._otherPlayers = ${JSON.stringify(otherPlayers)};
global._food = ${JSON.stringify(food)};

${code}

${botApi}
`;

      const actions = await runBot(preparedCode);
      if (actions?.[0]?.type === "move") {
        world.moveBot(bot.id, actions[0].x, actions[0].y);
      }
    } catch (err) {
      // TODO(yurij): notify user that their bot crashed
      console.log(err);
    }
  }
}

type StartEngineArgs = {
  botApi: string;
};

function startEngine({ botApi }: StartEngineArgs) {
  let bots = botUtils.getBots();

  botUtils.subscribeToBotsUpdate((newBots) => {
    bots = newBots;
  });

  setInterval(() => {
    runBots({ bots, world: WORLD, botApi });
  }, 250);
}

export default defineNitroPlugin(async () => {
  const level01Api = await useStorage("assets:botApis").getItem("level01.js");

  if (!level01Api || typeof level01Api !== "string") {
    throw new Error("Could not load level01.js");
  }

  startEngine({ botApi: level01Api });
});
