import EventEmitter from "node:events";
import fs from "node:fs";
import prisma from "~/other/db";

const BOT_CODE_DIR = process.env.BOT_CODE_DIR || "./bot-code";

export interface BotCode {
  id: string;
  code: string;
  username: string;
  userId: number;
}

export type BotCodes = Record<string, BotCode>;

let STORE: BotCodes = {};

const botEventEmitter = new EventEmitter();

type SubmitBotCodeArgs = {
  code: string;
  username: string;
  userId: number;
};

export async function submitBotCode({ code, username, userId }: SubmitBotCodeArgs) {
  // ensure each user has only one bot
  const id = Object.values(STORE).find(botCode => botCode.username === username)?.id || Math.random().toString(36).substring(5);
  const botCode = { id, code, username, userId };
  STORE[id] = botCode;
  saveBot(botCode);

  // Set inactive to false when a user submits code
  await prisma.user.update({
    where: { id: userId },
    data: { inactive: false },
  });

  botEventEmitter.emit("update", STORE);
}

export function clearBots() {
  STORE = {};
}

export async function getBots() {
  // Get all inactive users
  const inactiveUsers = await prisma.user.findMany({
    where: { inactive: true },
    select: { id: true },
  });
  const inactiveUserIds = new Set(inactiveUsers.map(user => user.id));

  // Filter out bots from inactive users
  const activeBots = { ...STORE };
  const filteredBots: BotCodes = {};

  // Use a safer approach than delete
  for (const id in activeBots) {
    if (!inactiveUserIds.has(activeBots[id].userId)) {
      filteredBots[id] = activeBots[id];
    }
  }

  return filteredBots;
}

export function subscribeToBotsUpdate(onUpdate: (bots: BotCodes) => void): () => void {
  botEventEmitter.on("update", onUpdate);
  return () => botEventEmitter.off("update", onUpdate);
}

async function loadBots() {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    return;
  }

  const files = fs.readdirSync(BOT_CODE_DIR);

  // Get all inactive users
  const inactiveUsers = await prisma.user.findMany({
    where: { inactive: true },
    select: { id: true },
  });
  const inactiveUserIds = new Set(inactiveUsers.map(user => user.id));

  for (const file of files) {
    const code = fs.readFileSync(`${BOT_CODE_DIR}/${file}`, "utf8");
    const username = file.split("-")[0];
    const id = file.split("-")[1];
    const userId = file.split("-")[2]?.replace(".js", "");
    if (!id || !code || !username || !userId) {
      throw new Error(`Invalid bot code file: ${file}`);
    }

    // Skip inactive users
    if (inactiveUserIds.has(+userId)) {
      continue;
    }

    STORE[id] = { id, code, username, userId: +userId };
  }
}

function saveBot({ id, code, username, userId }: BotCode) {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    fs.mkdirSync(BOT_CODE_DIR);
  }
  const botCodeFile = `${BOT_CODE_DIR}/${username}-${id}-${userId}.js`;

  fs.writeFileSync(botCodeFile, code);
}

// Initialize bots on module load
loadBots().catch((err) => {
  console.error("Failed to load bots:", err);
});
