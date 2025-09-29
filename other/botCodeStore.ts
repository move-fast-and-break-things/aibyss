import EventEmitter from "node:events";
import fs from "node:fs/promises";
import db from "~/other/db";

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
  await saveBot(botCode);

  // Submitting code makes the user active
  await db.user.update({
    where: { id: userId },
    data: { inactive: false },
  });

  botEventEmitter.emit("update", STORE);
}

export function clearBots() {
  STORE = {};
}

export function getBots() {
  return { ...STORE };
}

export function subscribeToBotsUpdate(onUpdate: (bots: BotCodes) => void): () => void {
  botEventEmitter.on("update", onUpdate);
  return () => botEventEmitter.off("update", onUpdate);
}

async function fsExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadBots() {
  if (!await fsExists(BOT_CODE_DIR)) {
    return;
  }

  const files = await fs.readdir(BOT_CODE_DIR);

  const inactiveUsers = await db.user.findMany({
    where: { inactive: true },
    select: { id: true },
  });
  const inactiveUserIds = new Set(inactiveUsers.map(user => user.id));

  for (const file of files) {
    const code = await fs.readFile(`${BOT_CODE_DIR}/${file}`, "utf8");
    const username = file.split("-")[0];
    const id = file.split("-")[1];
    const userId = file.split("-")[2]?.replace(".js", "");
    if (!id || !code || !username || !userId) {
      throw new Error(`Invalid bot code file: ${file}`);
    }

    if (inactiveUserIds.has(+userId)) {
      continue;
    }

    STORE[id] = { id, code, username, userId: +userId };
  }

  botEventEmitter.emit("update", STORE);
}

async function saveBot({ id, code, username, userId }: BotCode) {
  if (!await fsExists(BOT_CODE_DIR)) {
    await fs.mkdir(BOT_CODE_DIR);
  }
  const botCodeFile = `${BOT_CODE_DIR}/${username}-${id}-${userId}.js`;

  await fs.writeFile(botCodeFile, code);
}

loadBots()
  .then(() => {
    console.log(`Loaded ${Object.keys(STORE).length} bots`);
  });
