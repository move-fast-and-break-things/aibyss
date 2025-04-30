import EventEmitter from "node:events";
import fs from "node:fs";
import { db } from "./db";

const BOT_CODE_DIR = process.env.BOT_CODE_DIR || "./bot-code";

export interface BotCode {
  id: string;
  code: string;
  username: string;
  userId: number;
  inactive?: boolean;
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
  const botCode = { id, code, username, userId, inactive: false };
  STORE[id] = botCode;
  saveBot(botCode);
  
  // Set inactive=false in the database when a user submits code
  await db.user.update({
    where: { id: userId },
    data: { inactive: false }
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

async function loadBots() {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    return;
  }

  const files = fs.readdirSync(BOT_CODE_DIR);
  const activeUsers = new Set((await db.user.findMany({
    where: { inactive: false },
    select: { id: true }
  })).map(user => user.id));

  for (const file of files) {
    const code = fs.readFileSync(`${BOT_CODE_DIR}/${file}`, "utf8");
    const username = file.split("-")[0];
    const id = file.split("-")[1];
    const userId = file.split("-")[2]?.replace(".js", "");
    if (!id || !code || !username || !userId) {
      throw new Error(`Invalid bot code file: ${file}`);
    }
    
    const numUserId = +userId;
    // Only load bots for active users
    if (activeUsers.has(numUserId)) {
      STORE[id] = { id, code, username, userId: numUserId, inactive: false };
    }
  }
}

function saveBot({ id, code, username, userId }: BotCode) {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    fs.mkdirSync(BOT_CODE_DIR);
  }
  const botCodeFile = `${BOT_CODE_DIR}/${username}-${id}-${userId}.js`;

  fs.writeFileSync(botCodeFile, code);
}

loadBots();
