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

let ACTIVE_BOT_STORE: BotCodes = {};

const botEventEmitter = new EventEmitter();

type SubmitBotCodeArgs = {
  code: string;
  username: string;
  userId: number;
};

function formatBotCodeFilename({ username, id, userId }: { username: string; id: string; userId: number }) {
  return `${BOT_CODE_DIR}/${username}-${id}-${userId}.js`;
}

function extractBotMetadataFromFilename(filename: string) {
  const username = filename.split("-")[0];
  const id = filename.split("-")[1];
  const userId = filename.split("-")[2]?.replace(".js", "");
  if (!id || !username || !userId) {
    throw new Error(`Invalid bot code file: ${filename}`);
  }
  return { id, username, userId: Number(userId) };
}

async function getFirstUserBotMetadata(userId: number) {
  const userBotFiles = await fs.readdir(BOT_CODE_DIR);
  for (const file of userBotFiles) {
    const { username, id, userId: fileUserId } = extractBotMetadataFromFilename(file);
    if (fileUserId === userId) {
      return { id, username, userId: fileUserId };
    }
  }
}

export async function submitBotCode({ code, username, userId }: SubmitBotCodeArgs) {
  const existingBotMetadata = await getFirstUserBotMetadata(userId);
  // Ensure that every user has only one bot
  const id = existingBotMetadata?.id || Math.random().toString(36).substring(5);
  const botCode = { id, code, username, userId };
  ACTIVE_BOT_STORE[id] = botCode;
  await saveBot(botCode);

  // Submitting code makes the user active
  await db.user.update({
    where: { id: userId },
    data: { inactive: false },
  });

  botEventEmitter.emit("update", ACTIVE_BOT_STORE);
}

export function clearBots() {
  ACTIVE_BOT_STORE = {};
}

export function getBots() {
  return { ...ACTIVE_BOT_STORE };
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
    const { username, id, userId } = extractBotMetadataFromFilename(file);
    if (!id || !username || !userId) {
      throw new Error(`Invalid bot code file: ${file}`);
    }

    if (inactiveUserIds.has(userId)) {
      continue;
    }

    const code = await fs.readFile(`${BOT_CODE_DIR}/${file}`, "utf8");
    if (!code) {
      throw new Error(`Failed to read bot code file: ${file}`);
    }

    ACTIVE_BOT_STORE[id] = { id, code, username, userId };
  }

  botEventEmitter.emit("update", ACTIVE_BOT_STORE);
}

async function saveBot({ id, code, username, userId }: BotCode) {
  if (!await fsExists(BOT_CODE_DIR)) {
    await fs.mkdir(BOT_CODE_DIR);
  }
  const botCodeFile = formatBotCodeFilename({ username, id, userId });

  await fs.writeFile(botCodeFile, code);
}

loadBots()
  .then(() => {
    console.log(`Loaded ${Object.keys(ACTIVE_BOT_STORE).length} bots`);
  });
