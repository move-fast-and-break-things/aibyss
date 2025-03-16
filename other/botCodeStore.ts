import EventEmitter from "node:events";
import fs from "node:fs";

const BOT_CODE_DIR = process.env.BOT_CODE_DIR || "./bot-code";

export interface BotCode {
  id: string;
  code: string;
  username: string;
  userId: number;
  timestamp: number;
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

function saveBot({ id, code, username, userId, timestamp }: BotCode) {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    fs.mkdirSync(BOT_CODE_DIR);
  }
  
  // Save historical version
  const historicalFile = `${BOT_CODE_DIR}/${userId}-${timestamp}.js`;
  fs.writeFileSync(historicalFile, code);
  
  // Save latest version
  const latestFile = `${BOT_CODE_DIR}/${userId}-latest.js`;
  fs.writeFileSync(latestFile, code);
}

export function getBotVersions(userId: number): {timestamp: number; code: string}[] {
  if (!fs.existsSync(BOT_CODE_DIR)) return [];
  
  return fs.readdirSync(BOT_CODE_DIR)
    .filter(file => file.startsWith(`${userId}-`) && !file.endsWith('-latest.js'))
    .map(file => {
      const timestamp = parseInt(file.split('-')[1].replace('.js', ''));
      const code = fs.readFileSync(`${BOT_CODE_DIR}/${file}`, 'utf8');
      return { timestamp, code };
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}

loadBots();
