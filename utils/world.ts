import getRandomElement from "./getRandomElement";

export interface Sprite {
  x: number;
  y: number;
  radius: number;
}

interface Position {
  x: number;
  y: number;
}

export interface BotSprite extends Sprite {
  botId: string;
  color: string;
  spawnId: string;
}

export interface WorldState {
  bots: BotSprites;
  food: Sprite[];
  width: number;
  height: number;
}

type BotSprites = Map<string, BotSprite>;

type WorldArgs = {
  width: number;
  height: number;
};

const BOT_COLORS = [
  "#00FF00",
  "#0000FF",
  "#00FFFF",
  "#FF0000",
  "#114B5F",
  "#E0B0FF",
  "#FFD700",
  "#FF00FF",
  "#FFA500",
];

export default class World {
  private botSpawns: BotSprites = new Map();
  private botIdToSpawnId: Map<string, string> = new Map();
  private food: Sprite[] = [];
  private width: number;
  private height: number;
  private minSpawnDistance = 10;
  private maxMoveDistance = 2;
  private newBotRadius = 5;

  constructor({ width, height }: WorldArgs) {
    this.width = width;
    this.height = height;
    this.generateFood();
  }

  generateFood() {
    for (let i = 0; i < 100; i++) {
      const newX = Math.floor(Math.random() * this.width);
      const newY = Math.floor(Math.random() * this.height);
      const newRadius = 1;
      this.food.push({ x: newX, y: newY, radius: newRadius });
    }
  }

  private positionStringify({ x, y }: { x: number; y: number }): string {
    return `${x}-${y}`;
  }

  private getAvailableBotPositions(newBotRadius: number): { x: number; y: number }[] {
    const availablePositions: { x: number; y: number }[] = [];
    const takenPositions: Set<string> = new Set();

    // to avoid computing distances between points when spawning new bots, assume that bots are square
    for (const bot of this.botSpawns.values()) {
      const { x, y, radius } = bot;
      const safeRadius = radius + this.minSpawnDistance + newBotRadius;

      const minX = Math.max(x - safeRadius, 0);
      const maxX = Math.min(x + safeRadius, this.width);
      const minY = Math.max(y - safeRadius, 0);
      const maxY = Math.min(y + safeRadius, this.height);

      for (let i = minX; i < maxX; i++) {
        for (let j = minY; j < maxY; j++) {
          takenPositions.add(this.positionStringify({ x: i, y: j }));
        }
      }
    }

    const minX = newBotRadius;
    const maxX = this.width - newBotRadius;
    const minY = newBotRadius;
    const maxY = this.height - newBotRadius;

    for (let i = minX; i < maxX; i++) {
      for (let j = minY; j < maxY; j++) {
        const position = { x: i, y: j };
        const positionStr = this.positionStringify(position);
        if (!takenPositions.has(positionStr)) {
          availablePositions.push(position);
        }
      }
    }

    return availablePositions;
  }

  hasBot(botId: string) {
    return this.botIdToSpawnId.has(botId);
  }

  addBot(botId: string): BotSprite {
    const availablePositions = this.getAvailableBotPositions(this.newBotRadius);

    if (availablePositions.length === 0) {
      throw new Error("No available positions to spawn bot");
    }

    const randomPosition = getRandomElement(availablePositions);
    const color = getRandomElement(BOT_COLORS);

    // spawnId is unique per bot live
    // useful to track respawns on the UI
    const spawnId = Math.random().toString(36).substring(5);

    const newBot = {
      ...randomPosition,
      botId,
      radius: this.newBotRadius,
      color,
      spawnId,
    };
    this.botSpawns.set(spawnId, newBot);
    this.botIdToSpawnId.set(botId, spawnId);
    return newBot;
  }

  getState(): WorldState {
    return {
      bots: this.botSpawns,
      food: this.food,
      width: this.width,
      height: this.height,
    };
  }

  static distance(a: Position, b: Position) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  static computeClosestXYWithinDistance(a: Position, b: Position, distance: number) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const angle = Math.atan2(dy, dx);
    const newX = a.x + distance * Math.cos(angle);
    const newY = a.y + distance * Math.sin(angle);
    return { x: newX, y: newY };
  }

  moveBot(botId: string, x: number, y: number) {
    const spawnId = this.botIdToSpawnId.get(botId);
    if (!spawnId) {
      throw new Error(`Bot with id ${botId} not found`);
    }

    const bot = this.botSpawns.get(spawnId);
    if (!bot) {
      throw new Error(`Bot with id ${botId} not found`);
    }

    const distance = World.distance(bot, { x, y });
    if (distance > this.maxMoveDistance) {
      // compute closest possible x and y
      const { x: newX, y: newY } = World.computeClosestXYWithinDistance(bot, { x, y }, this.maxMoveDistance);
      x = newX;
      y = newY;
    }

    bot.x = x;
    bot.y = y;

    let checkLimit = 5;
    while (this.checkCollisions(botId) && --checkLimit) {
      continue;
    }
  }

  checkCollisions(botId: string) {
    const spawnId = this.botIdToSpawnId.get(botId);
    if (!spawnId) {
      throw new Error(`Bot with id ${botId} not found`);
    }

    const bot = this.botSpawns.get(spawnId);
    if (!bot) {
      throw new Error(`Bot with id ${botId} not found`);
    }

    // check if bot eats other bots
    const botSpawns = this.botSpawns;
    const botIdsToRemove: string[] = [];
    for (const [otherBotSpawnId, otherBot] of botSpawns.entries()) {
      if (otherBotSpawnId === spawnId) {
        continue;
      }

      const distance = World.distance(bot, otherBot);
      if (distance < bot.radius && bot.radius > otherBot.radius) {
        botIdsToRemove.push(otherBotSpawnId);
      }
    }

    // check if bot eats food
    const food = this.food;
    const foodIdxToRemove: number[] = [];
    for (let i = 0; i < food.length; ++i) {
      // it's safe to cast to Sprite because know that `i` is within the bounds of the array
      const distance = World.distance(bot, food[i] as Sprite);
      if (distance < bot.radius) {
        foodIdxToRemove.push(i);
      }
    }

    // remove food and bots
    for (const botSpawnIdToRemove of botIdsToRemove) {
      const botToRemove = botSpawns.get(botSpawnIdToRemove);
      if (!botToRemove) {
        continue;
      }
      bot.radius += botToRemove.radius;
      this.botIdToSpawnId.delete(botToRemove.botId);
      botSpawns.delete(botSpawnIdToRemove);
    }

    // sort in descending order to avoid index shifting when removing elements
    foodIdxToRemove.sort((a, b) => b - a);
    for (const foodIdx of foodIdxToRemove) {
      // it's safe to cast to Sprite because we know that `foodIdx` is within the bounds of the array
      bot.radius += (food[foodIdx] as Sprite).radius;
      food.splice(foodIdx, 1);
    }

    return Boolean(botIdsToRemove.length || foodIdxToRemove.length);
  }
}
