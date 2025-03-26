import EventEmitter from "node:events";
import fs from "node:fs";

const BOT_CODE_DIR = process.env.BOT_CODE_DIR || "./bot-code";

export interface BotCode {
  id: string;
  code: string;
  username: string;
  userId: number;
  timestamp?: number;
  isLatest?: boolean;
}

export interface BotCodeVersion {
  code: string;
  timestamp: number;
}

export type BotCodes = Record<string, BotCode>;
export type BotCodeVersions = Record<string, BotCodeVersion[]>;

let STORE: BotCodes = {};
let VERSION_STORE: BotCodeVersions = {};

const botEventEmitter = new EventEmitter();

type SubmitBotCodeArgs = {
  code: string;
  username: string;
  userId: number;
};

export function submitBotCode({ code, username, userId }: SubmitBotCodeArgs) {
  const id = Object.values(STORE).find(botCode => botCode.username === username)?.id || Math.random().toString(36).substring(5);
  const timestamp = Date.now();
  
  // Store new version
  if (!VERSION_STORE[userId]) {
    VERSION_STORE[userId] = [];
  }
  VERSION_STORE[userId].push({ code, timestamp });
  
  // Update latest version
  const botCode = { id, code, username, userId, timestamp, isLatest: true };
  STORE[id] = botCode;
  saveBot(botCode);
  botEventEmitter.emit("update", STORE);
}

export function getCodeVersions(userId: number): BotCodeVersion[] {
  return VERSION_STORE[userId] || [];
}

export function restoreCodeVersion(userId: number, timestamp: number) {
  const version = VERSION_STORE[userId]?.find(v => v.timestamp === timestamp);
  if (!version) {
    throw new Error('Version not found');
  }
  
  // Update latest version
  const id = Object.values(STORE).find(botCode => botCode.userId === userId)?.id;
  if (id) {
    STORE[id].code = version.code;
    saveBot(STORE[id]);
    botEventEmitter.emit("update", STORE);
  }
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

function saveBot({ id, code, username, userId }: BotCode) {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    fs.mkdirSync(BOT_CODE_DIR);
  }
  const botCodeFile = `${BOT_CODE_DIR}/${username}-${id}-${userId}.js`;

  fs.writeFileSync(botCodeFile, code);
}

loadBots();
