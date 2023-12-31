import * as botUtils from "~/utils/botstore";

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import ivm from 'isolated-vm';
import World from "~/utils/world";

const MEMORY_LIMIT_MB = 64;
const TIME_LIMIT_MS = 100;

export const WORLD = new World ({ width: 600, height: 600 });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_LEVEL_1 = fs.readFileSync(path.join(__dirname, '..', '..', 'utils', 'botApis', 'level01.js'), 'utf8');

async function runBot(code: string) {
  const isolate = new ivm.Isolate({ memoryLimit: MEMORY_LIMIT_MB });
  const context = await isolate.createContext();
  const jail = context.global;
  await jail.set('global', jail.derefInto());
  const result = await context.eval(`${code}\n${API_LEVEL_1}`, { timeout: TIME_LIMIT_MS });
  return JSON.parse(result);
}

async function runBots(bots: botUtils.Bots, world: World) {
  const state = world.getState();
  const botIds = Object.keys(bots);

  for (const botId of botIds) {
    if (!state.bots[botId]) {
      world.addBot(botId);
    }
  }

  for (const bot of Object.values(bots)) {
    const { code } = bot;
    const actions = await runBot(code);
    // TODO(yurij): sanitize actions
    // TODO(yurij): limit actions to max actions per step
    if (actions?.[0]?.type === "move") {
      world.moveBot(bot.id, actions[0].x, actions[0].y);
    }
  }
}

function startEngine() {
  let bots = botUtils.getBots();

  botUtils.subscribeToBotsUpdate((newBots) => {
    bots = newBots;
  });

  setInterval(() => {
    runBots(bots, WORLD);
  }, 1000);
}

export default defineNitroPlugin((nitroApp) => {
  startEngine();
})
