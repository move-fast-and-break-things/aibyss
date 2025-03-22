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

export interface BotCodeVersion extends BotCode {
  timestamp: number;
  versionId: string;
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

function loadBots() {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    return;
  }

  const files = fs.readdirSync(BOT_CODE_DIR);
  
  // Only load latest files (those without timestamp in the filename)
  const latestFiles = files.filter(file => {
    // Skip versioned files (those with timestamps)
    return !file.includes('-v-');
  });

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
  const versionId = `v-${timestamp}`;
  const botVersionFile = `${BOT_CODE_DIR}/${username}-${id}-${userId}-${versionId}.js`;

  fs.writeFileSync(botVersionFile, code);
}

/**
 * Gets all versions of code for a specific user
 * @param userId The user ID to get versions for
 * @returns Array of bot code versions sorted by timestamp (newest first)
 */
export function getUserCodeVersions(userId: number): BotCodeVersion[] {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BOT_CODE_DIR);
  const userFiles = files.filter(file => {
    const parts = file.split("-");
    const fileUserId = parts[2]?.replace(".js", "");
    return fileUserId === userId.toString() && parts.length >= 4 && parts[3]?.startsWith("v-");
  });

  const versions: BotCodeVersion[] = [];
  
  for (const file of userFiles) {
    const code = fs.readFileSync(path.join(BOT_CODE_DIR, file), "utf8");
    const parts = file.split("-");
    const username = parts[0];
    const id = parts[1];
    const userId = parseInt(parts[2], 10);
    const versionId = parts[3];
    const timestamp = parseInt(versionId.replace("v-", ""), 10);
    
    versions.push({
      id,
      code,
      username,
      userId,
      versionId,
      timestamp
    });
  }
  
  // Sort by timestamp, newest first
  return versions.sort((a, b) => b.timestamp - a.timestamp);
}

loadBots();
