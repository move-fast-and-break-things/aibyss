import ivm from "isolated-vm";
import prepareBotCode from "~/other/prepareBotCode";
import * as botCodeStore from "~/other/botCodeStore";
import World, { type WorldState } from "~/other/world";
import { recordGameEnd, type GameStat } from "~/other/recordGamedb";

const MEMORY_LIMIT_MB = 64;
const TIME_LIMIT_MS = 75;
const MAX_ROUND_TIME_MS = 15 * 1000 * 60;
const GAME_STEP_INTERVAL_MS = 250;

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
  prevWorldState: WorldState;
  botApi: string;
};

async function runBots({ bots, world, prevWorldState, botApi }: RunBotArgs) {
  for (const bot of Object.values(bots)) {
    if (!world.hasBot(bot.id)) {
      world.addBot(bot.id);
    }
  }

  const state = world.getState();
  const botArray = Object.values(bots);

  const botActions = [];
  for (const bot of botArray) {
    try {
      const preparedCode = prepareBotCode({
        bot,
        botInfo: bots,
        state,
        previousState: prevWorldState,
        botApi,
      });
      const actions = await runBot(preparedCode);
      botActions.push(actions);
    } catch (err) {
      // TODO(yurij): notify user that their bot crashed
      console.error(err);
      botActions.push([]);
    }
  };

  for (const [i, actions] of botActions.entries()) {
    const botId = botArray[i]?.id;
    if (botId && actions?.[0]?.type === "move") {
      world.moveBot(botId, actions[0].x, actions[0].y);
    }
  }

  let collisionCheckLimit = 5;
  while (world.checkCollisions() && --collisionCheckLimit) {
    continue;
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

  const gameTimeoutInterval = setInterval(() => {
    endGame("Time's up");
    console.debug(`The World was restarted after ${MAX_ROUND_TIME_MS} ms`);
  }, MAX_ROUND_TIME_MS);

  // at the very start of the game, `prevWorldState` equals to the current world state
  let prevWorldState = WORLD_REF.world.getState();
  setInterval(async () => {
    await runBots({ bots, world: WORLD_REF.world, prevWorldState, botApi });
    prevWorldState = WORLD_REF.world.getState();
    for (const bot of prevWorldState.bots.values()) {
      if (bot.radius > prevWorldState.height / 4) {
        endGame("Player overdominating");
        console.debug(`The World was restarted cus ${bot.botId} was oversized`);
        gameTimeoutInterval.refresh();
      }
    }
  }, GAME_STEP_INTERVAL_MS);
}

function endGame(reason: string) {
  const endTime = new Date();
  const worldState = WORLD_REF.world.getState();
  const worldStats = WORLD_REF.world.getStats();
  recordGameEnd({
    startTime: worldStats.startTime,
    endTime: endTime,
    endReason: reason,
    stats: Array.from(worldStats.stats.entries()).map(([botId, stat]) => {
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
