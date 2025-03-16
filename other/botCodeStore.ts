import EventEmitter from "node:events";
import fs from "node:fs";
import path from "node:path";

const BOT_CODE_DIR = process.env.BOT_CODE_DIR || "./bot-code";

export interface BotCode {
  id: string;
  code: string;
  username: string;
  userId: number;
  timestamp?: number;
}

export type BotCodeVersion = BotCode & {
  timestamp: number;
};

export type BotCodes = Record<string, BotCode>;
export type BotCodeVersions = Record<string, BotCodeVersion[]>;

let STORE: BotCodes = {};
let VERSIONS_STORE: BotCodeVersions = {};

const botEventEmitter = new EventEmitter();

type SubmitBotCodeArgs = {
  code: string;
  username: string;
  userId: number;
};

export function submitBotCode({ code, username, userId }: SubmitBotCodeArgs) {
  // ensure each user has only one active bot
  const id = Object.values(STORE).find(botCode => botCode.username === username)?.id || Math.random().toString(36).substring(5);
  const timestamp = Date.now();
  const botCode = { id, code, username, userId };
  const versionedBotCode = { ...botCode, timestamp };

  // Add to the main store (current version)
  STORE[id] = botCode;
  
  // Add to versions store
  if (!VERSIONS_STORE[username]) {
    VERSIONS_STORE[username] = [];
  }
  VERSIONS_STORE[username].push(versionedBotCode);
  
  // Save both the current version and the versioned file
  saveBot(botCode);
  saveVersionedBot(versionedBotCode);
  
  // Notify subscribers
  botEventEmitter.emit("update", STORE);
  botEventEmitter.emit("version-update", VERSIONS_STORE);
}

export function clearBots() {
  STORE = {};
}

export function getBots() {
  return { ...STORE };
}

export function getBotVersions(username: string): BotCodeVersion[] {
  return [...(VERSIONS_STORE[username] || [])].sort((a, b) => b.timestamp - a.timestamp);
}

export function getLatestBotVersion(username: string): BotCodeVersion | null {
  const versions = getBotVersions(username);
  return versions.length > 0 ? versions[0] : null;
}

export function revertToBotVersion(username: string, versionTimestamp: number): boolean {
  const version = VERSIONS_STORE[username]?.find(v => v.timestamp === versionTimestamp);
  if (!version) return false;
  
  // Update current version with the code from the selected version
  const currentBot = Object.values(STORE).find(bot => bot.username === username);
  if (currentBot) {
    currentBot.code = version.code;
    saveBot(currentBot);
    botEventEmitter.emit("update", STORE);
    return true;
  }
  
  return false;
}

export function subscribeToBotsUpdate(onUpdate: (bots: BotCodes) => void): () => void {
  botEventEmitter.on("update", onUpdate);
  return () => botEventEmitter.off("update", onUpdate);
}

export function subscribeToVersionsUpdate(onUpdate: (versions: BotCodeVersions) => void): () => void {
  botEventEmitter.on("version-update", onUpdate);
  return () => botEventEmitter.off("version-update", onUpdate);
}

function loadBots() {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    return;
  }

  const files = fs.readdirSync(BOT_CODE_DIR);
  
  // Load regular bot files and versioned bot files
  for (const file of files) {
    if (file.includes('-latest.js')) {
      // Skip the latest file as it's just a duplicate for easy access
      continue;
    }
    
    try {
      const code = fs.readFileSync(path.join(BOT_CODE_DIR, file), "utf8");
      
      // Check if this is a versioned file (has timestamp)
      if (file.match(/\d{13}\.js$/)) {
        const parts = file.split("-");
        const username = parts[0];
        const id = parts[1];
        const timestampStr = parts[2].replace(".js", "");
        const timestamp = parseInt(timestampStr, 10);
        const userId = file.split("-")[3]?.replace(".js", "");
        
        if (!id || !code || !username || !userId || isNaN(timestamp)) {
          console.error(`Invalid versioned bot code file: ${file}`);
          continue;
        }
        
        const versionedBotCode = { id, code, username, userId: +userId, timestamp };
        
        if (!VERSIONS_STORE[username]) {
          VERSIONS_STORE[username] = [];
        }
        VERSIONS_STORE[username].push(versionedBotCode);
        
        // Also add the most recent version to the main store
        const existingVersion = VERSIONS_STORE[username]
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        if (existingVersion) {
          STORE[existingVersion.id] = {
            id: existingVersion.id,
            code: existingVersion.code,
            username: existingVersion.username,
            userId: existingVersion.userId
          };
        }
      } else {
        // Regular bot file
        const username = file.split("-")[0];
        const id = file.split("-")[1];
        const userId = file.split("-")[2]?.replace(".js", "");
        
        if (!id || !code || !username || !userId) {
          console.error(`Invalid bot code file: ${file}`);
          continue;
        }
        
        STORE[id] = { id, code, username, userId: +userId };
      }
    } catch (error) {
      console.error(`Error loading bot file ${file}:`, error);
    }
  }
}

function saveBot({ id, code, username, userId }: BotCode) {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    fs.mkdirSync(BOT_CODE_DIR);
  }
  
  // Regular bot file
  const botCodeFile = `${BOT_CODE_DIR}/${username}-${id}-${userId}.js`;
  fs.writeFileSync(botCodeFile, code);
  
  // Latest bot file (for easy access)
  const latestBotCodeFile = `${BOT_CODE_DIR}/${username}-latest.js`;
  fs.writeFileSync(latestBotCodeFile, code);
}

function saveVersionedBot({ id, code, username, userId, timestamp }: BotCodeVersion) {
  if (!fs.existsSync(BOT_CODE_DIR)) {
    fs.mkdirSync(BOT_CODE_DIR);
  }
  
  // Version with timestamp
  const versionedBotCodeFile = `${BOT_CODE_DIR}/${username}-${id}-${timestamp}-${userId}.js`;
  fs.writeFileSync(versionedBotCodeFile, code);
}

loadBots();