import EventEmitter from "node:events";
import fs from "node:fs";
import path from "node:path";

const BOT_CODE_DIR = process.env.BOT_CODE_DIR || "./bot-code";

export interface BotCode {
  id: string;
  code: string;
  username: string;
  userId: number;
}

export interface CodeVersion {
  code: string;
  timestamp: number;
  id: string;
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
  
  // Save both the latest version and a timestamped version
  saveBot(botCode);
  saveBotVersion(botCode);
  
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

export function getUserCodeVersions(userId: number): CodeVersion[] {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BOT_CODE_DIR);
  const versionFiles = files.filter(file => {
    const parts = file.split("-");
    return parts.length >= 4 && parts[2] === userId.toString() && parts[3].includes("version");
  });

  return versionFiles.map(file => {
    const code = fs.readFileSync(path.join(BOT_CODE_DIR, file), "utf8");
    const parts = file.split("-");
    const timestamp = parseInt(parts[3].replace("version", "").replace(".js", ""));
    const id = parts[1];
    
    return {
      code,
      timestamp,
      id
    };
  }).sort((a, b) => b.timestamp - a.timestamp); // Sort newest first
}

export function getLatestUserCode(userId: number): string | null {
  const userBot = Object.values(STORE).find(bot => bot.userId === userId);
  if (userBot) {
    return userBot.code;
  }
  return null;
}

function loadBots() {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    return;
  }

  const files = fs.readdirSync(BOT_CODE_DIR);
  
  // Only load the latest versions (non-versioned files)
  const latestFiles = files.filter(file => !file.includes("version"));

  for (const file of latestFiles) {
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

function saveBotVersion({ id, code, username, userId }: BotCode) {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    fs.mkdirSync(BOT_CODE_DIR);
  }
  
  const timestamp = Date.now();
  const versionFile = `${BOT_CODE_DIR}/${username}-${id}-${userId}-version${timestamp}.js`;
  
  fs.writeFileSync(versionFile, code);
}

loadBots();
