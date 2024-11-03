import EventEmitter from "node:events";
import fs from "node:fs";

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

export function submitBotCode({ code, username, userId }: SubmitBotCodeArgs) {
  // ensure each user has only one bot
  const id = Object.values(STORE).find(botCode => botCode.username === username)?.id || Math.random().toString(36).substring(5);
  const botCode = { id, code, username, userId };
  STORE[id] = botCode;
  saveBot(botCode);
  botEventEmitter.emit("update", STORE);
}

export function clearBots() {
  STORE = {};
}

export function getBots() {
  return { ...STORE };
}

export function getBotUsername(botId: string) {
  if (!STORE[botId]) {
    throw new Error(`bot with botId=${botId} not found in the botCodeStore`);
  }
  return STORE[botId].username;
}

export function subscribeToBotsUpdate(onUpdate: (bots: BotCodes) => void): () => void {
  botEventEmitter.on("update", onUpdate);
  return () => botEventEmitter.off("update", onUpdate);
}

function loadBots() {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    return;
  }

  const files = fs.readdirSync(BOT_CODE_DIR);

  for (const file of files) {
    const code = fs.readFileSync(`${BOT_CODE_DIR}/${file}`, "utf8");
    const username = file.split("-")[0];
    const id = file.split("-")[1];
    const userId = file.split("-")[2]?.replace(".js", "");
    if (!id || !code || !username || !userId) {
      throw new Error(`Invalid bot code file: ${file}`);
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

loadBots();
