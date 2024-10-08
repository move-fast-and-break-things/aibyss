import ivm from "isolated-vm";
import prepareBotCode from "~/other/prepareBotCode";
import * as botCodeStore from "~/other/botCodeStore";
import World from "~/other/world";
import { recordGameEnd, type GameStat } from "~/other/recordGamedb";

const MEMORY_LIMIT_MB = 64;
const TIME_LIMIT_MS = 75;
const MAX_ROUND_TIME_MS = 15 * 1000 * 60;

export const WORLD_REF = { world: new World ({ width: 600, height: 600 }) };

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
  bots: botCodeStore.BotCodes;
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
  let bots = botCodeStore.getBots();

  botCodeStore.subscribeToBotsUpdate((newBots) => {
    bots = newBots;
  });

  setInterval(() => {
    runBots({ bots, world: WORLD_REF.world, botApi });
    const worldState = WORLD_REF.world.getState();
    for (const bot of worldState.bots.values()) {
      if (bot.radius > worldState.height / 4) {
        endGame("Player overdominating");
        console.debug(`The World was restarted cus ${bot.botId} was oversized`);
      }
    }
  }, 250);

  setInterval(() => {
    endGame("Time's up");
    console.debug(`The World was restarted after ${MAX_ROUND_TIME_MS} ms`);
  }, MAX_ROUND_TIME_MS);
}

function endGame(reason: string) {
  const endTime = new Date();
  const worldState = WORLD_REF.world.getState();
  recordGameEnd({
    startTime: worldState.startTime,
    endTime: endTime,
    endReason: reason,
    stats: Array.from(worldState.stats.entries()).map(([botId, stat]) => {
      return {
        userId: botCodeStore.getBots()[botId]?.userId,
        size: worldState.bots.get(WORLD_REF.world.getSpawnId(botId))?.radius ?? 0,
        foodEaten: stat.foodEaten,
        kills: stat.kills,
        deaths: stat.deaths,
      };
    }).filter((entry): entry is GameStat => entry.userId !== undefined && entry.size !== undefined),
  });
  WORLD_REF.world = new World ({ width: 600, height: 600 });
}

export default defineNitroPlugin(async () => {
  const level01Api = await useStorage("assets:botApis").getItem("level01.js");

  if (!level01Api || typeof level01Api !== "string") {
    throw new Error("Could not load level01.js");
  }

  startEngine({ botApi: level01Api });
});
