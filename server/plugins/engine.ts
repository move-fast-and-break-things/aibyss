import ivm from "isolated-vm";
import prepareBotCode from "../../utils/prepareBotCode";
import * as botUtils from "~/utils/botstore";
import World from "~/utils/world";

const MEMORY_LIMIT_MB = 64;
const TIME_LIMIT_MS = 75;

export const WORLD = new World ({ width: 600, height: 600 });

async function runBot(code: string) {
  const isolate = new ivm.Isolate({ memoryLimit: MEMORY_LIMIT_MB });
  const context = await isolate.createContext();
  const jail = context.global;
  await jail.set("global", jail.derefInto());
  const result = await context.eval(code, { timeout: TIME_LIMIT_MS });
  isolate.dispose();
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
    if (!world.hasBot(botId)) {
      world.addBot(botId);
    }
  }

  for (const bot of Object.values(bots)) {
    try {
      const preparedCode = prepareBotCode({ bot, state, botApi });
      if (!preparedCode) {
        console.error(`Failed to prepare code for bot ${bot.id}`);
        continue;
      }

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
