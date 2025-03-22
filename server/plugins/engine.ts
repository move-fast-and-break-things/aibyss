import { z } from "zod";
import { gameStepCodeRunTimeMs, botCodeRunTimeMs, gameStepTimeMs, gameStepMoveBotTimeMs, gameStepCollisionCheckTimeMs, gameStepFoodSpawnTimeMs } from "../other/engineMetrics";
import prepareBotCode from "~/other/prepareBotCode";
import * as botCodeStore from "~/other/botCodeStore";
import World, { type WorldState } from "~/other/world";
import { recordGameEnd, type GameStat } from "~/other/recordGamedb";
import { CodeRunner } from "~/other/CodeRunner";

const MAX_ROUND_TIME_MS = 15 * 1000 * 60;
const GAME_STEP_INTERVAL_MS = 250;
const WORLD_SIZE = 600;

// Define the schema for bot actions
const MoveActionSchema = z.object({
  type: z.literal("move"),
  x: z.number(),
  y: z.number(),
});

export const WORLD_REF = { world: new World ({ width: WORLD_SIZE, height: WORLD_SIZE }) };
const codeRunners = new Array(10).fill(0).map(() => new CodeRunner());

type RunBotArgs = {
  bots: botCodeStore.BotCodes;
  world: World;
  prevBotState: WorldState["bots"];
  botApi: string;
};

async function runBots({ bots, world, prevBotState, botApi }: RunBotArgs) {
  for (const bot of Object.values(bots)) {
    if (!world.hasBot(bot.id)) {
      world.addBot(bot.id);
    }
  }

  const state = world.getState();
  const botArray = Object.values(bots);

  const preparedBotCodes = botArray.map(bot => prepareBotCode({
    bot,
    botInfo: bots,
    state,
    prevBotState,
    botApi,
  }));

  const allBotCodeRuntimeStartTs = Date.now();
  const botActions = await Promise.all(preparedBotCodes.map(async (preparedCode, i) => {
    const codeRunner = codeRunners[i % codeRunners.length];
    if (!codeRunner) {
      throw new Error("unexpected: codeRunner is undefined");
    }

    const bot = botArray[i];
    if (!bot) {
      throw new Error("unexpected: bot is undefined");
    }

    const botCodeRuntimeStartTs = Date.now();
    try {
      const result = await codeRunner.runCode(preparedCode);
      return JSON.parse(result);
    } catch (err) {
      console.error(err);
      if (bot.username === 'player') {
        WORLD_REF.world.playerBotError = err?.stack || String(err);
      }
      return [];
    } finally {
      botCodeRunTimeMs.observe({ username: bot.username }, Date.now() - botCodeRuntimeStartTs);
    }
  }));
  gameStepCodeRunTimeMs.observe(Date.now() - allBotCodeRuntimeStartTs);

  const moveBotStartTs = Date.now();
  for (const [i, actions] of botActions.entries()) {
    const botId = botArray[i]?.id;
    if (botId && actions?.[0]) {
      try {
        const action = MoveActionSchema.parse(actions[0]);
        world.moveBot(botId, action.x, action.y);
      } catch (err) {
        // Invalid action format, skipping
        console.error(`Invalid action format from bot ${botId}:`, err);
      }
    }
  }
  gameStepMoveBotTimeMs.observe(Date.now() - moveBotStartTs);

  const collisionCheckStartTs = Date.now();
  let collisionCheckLimit = 5;
  while (world.checkCollisions() && --collisionCheckLimit) {
    continue;
  }
  gameStepCollisionCheckTimeMs.observe(Date.now() - collisionCheckStartTs);

  const foodSpawnStartTs = Date.now();
  world.spawnFood();
  gameStepFoodSpawnTimeMs.observe(Date.now() - foodSpawnStartTs);
}

type StartEngineArgs = {
  botApi: string;
};

async function startEngine({ botApi }: StartEngineArgs) {
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
  // eslint-disable-next-line no-constant-condition -- we want to run the game loop forever
  while (true) {
    const startTs = Date.now();

    const newPrevWorldState = WORLD_REF.world.getState();
    try {
      await runBots({ bots, world: WORLD_REF.world, prevBotState: prevWorldState.bots, botApi });
    } catch (err) {
      console.error("run bots crashed", err);
    }
    prevWorldState = newPrevWorldState;

    const worldState = WORLD_REF.world.getState();
    for (const bot of worldState.bots.values()) {
      if (bot.radius > worldState.height / 4) {
        endGame("Player overdominating");
        console.debug(`The World was restarted cus ${bot.botId} was oversized`);
        gameTimeoutInterval.refresh();
      }
    }

    const endTs = Date.now();
    const timeSpentMs = endTs - startTs;
    gameStepTimeMs.observe(timeSpentMs);

    if (timeSpentMs < GAME_STEP_INTERVAL_MS) {
      await new Promise(resolve => setTimeout(resolve, GAME_STEP_INTERVAL_MS - timeSpentMs));
    } else {
      console.warn(`Game step took too long: ${timeSpentMs}ms (expected ${GAME_STEP_INTERVAL_MS}ms)`);
    }
  }
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
  }).catch(console.error);
  WORLD_REF.world = new World ({ width: WORLD_SIZE, height: WORLD_SIZE });
}

export default defineNitroPlugin(async () => {
  const level01Api = await useStorage("assets:botApis").getItem("level01.js");

  if (!level01Api || typeof level01Api !== "string") {
    throw new Error("Could not load level01.js");
  }

  startEngine({ botApi: level01Api })
    .catch(console.error);
});
