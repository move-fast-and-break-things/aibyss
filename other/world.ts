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

type Stats = {
  kills: number;
  deaths: number;
  foodEaten: number;
};

export default class World {
  private botSpawns: BotSprites = new Map();
  private botIdToSpawnId: Map<string, string> = new Map();
  private stats: Map<string, Stats> = new Map();
  private food: Sprite[] = [];
  private width: number;
  private height: number;
  private minSpawnDistance = 10;
  private maxMoveDistance = 2;
  private newBotRadius = 5;
  private maxFoodRadius = 3;
  private initialFoodCount = 200;
  private maxFoodCount = 250;
  private foodSpawnProbability = 0.008;
  private foodSpawnCount = 25;
  private startTime = new Date();

  constructor({ width, height }: WorldArgs) {
    this.width = width;
    this.height = height;
    this.generateFood(this.initialFoodCount);
  }

  generateFood(count: number) {
    const availablePositions = this.getAvailableSpawnPositions(this.maxFoodRadius);
    const foodToSpawn = Math.min(count, this.maxFoodCount - this.food.length);
    for (let i = 0; i < foodToSpawn; i++) {
      if (!availablePositions.length) {
        break;
      }
      const { element: randomPosition, idx } = getRandomElement(availablePositions);
      availablePositions.splice(idx, 1);
      const newRadius = Math.floor(Math.random() * this.maxFoodRadius) + 1;
      this.food.push({ ...World.deserializePosition(randomPosition), radius: newRadius });
    }
  }

  spawnFood() {
    if (Math.random() < this.foodSpawnProbability) {
      this.generateFood(this.foodSpawnCount);
    }
  }

  /**
   * Expects that both x and y are integers between 0 and 65535
   */
  private static serializePosition({ x, y }: { x: number; y: number }): number {
    return ((y & 0xFFFF) << 16) | (x & 0xFFFF);
  }

  private static deserializePosition(serializedPosition: number): { x: number; y: number } {
    const x = serializedPosition & 0xFFFF;
    const y = (serializedPosition >> 16) & 0xFFFF;
    return { x, y };
  }

  private getAvailableSpawnPositions(newEntityRadius: number): number[] {
    const takenPositions: Set<number> = new Set();

    // to avoid computing distances between points when spawning new bots, assume that bots are square
    for (const bot of this.botSpawns.values()) {
      const { x, y, radius } = bot;
      const safeRadius = radius + this.minSpawnDistance + newEntityRadius;

      const minX = Math.max(x - safeRadius, 0);
      const maxX = Math.min(x + safeRadius, this.width);
      const minY = Math.max(y - safeRadius, 0);
      const maxY = Math.min(y + safeRadius, this.height);

      for (let i = minX; i < maxX; i++) {
        for (let j = minY; j < maxY; j++) {
          takenPositions.add(World.serializePosition({ x: i, y: j }));
        }
      }
    }

    const minX = newEntityRadius;
    const maxX = this.width - newEntityRadius;
    const minY = newEntityRadius;
    const maxY = this.height - newEntityRadius;

    const availablePositions: number[] = new Array(this.height * this.width - takenPositions.size);
    let availablePositionsIdx = 0;
    for (let i = minX; i < maxX; i++) {
      for (let j = minY; j < maxY; j++) {
        const serializedPosition = World.serializePosition({ x: i, y: j });
        if (!takenPositions.has(serializedPosition)) {
          availablePositions[availablePositionsIdx++] = serializedPosition;
        }
      }
    }

    return availablePositions;
  }

  hasBot(botId: string) {
    return this.botIdToSpawnId.has(botId);
  }

  addBot(botId: string): BotSprite {
    const availablePositions = this.getAvailableSpawnPositions(this.newBotRadius);

    if (availablePositions.length === 0) {
      throw new Error("No available positions to spawn bot");
    }

    const { element: randomPosition } = getRandomElement(availablePositions);
    const { element: color } = getRandomElement(BOT_COLORS);

    // spawnId is unique per bot live
    // useful to track respawns on the UI
    const spawnId = Math.random().toString(36).substring(5);

    const newBot = {
      ...World.deserializePosition(randomPosition),
      botId,
      radius: this.newBotRadius,
      color,
      spawnId,
    };
    this.botSpawns.set(spawnId, newBot);
    this.botIdToSpawnId.set(botId, spawnId);
    if (!this.stats.has(botId)) {
      this.stats.set(botId, {
        kills: 0,
        deaths: 0,
        foodEaten: 0,
      });
    }
    return newBot;
  }

  /**
   * @returns {WorldState} a deep copy of the current state of the world
   */
  getState(): WorldState {
    const botSpawnsCopy = new Map();
    for (const [botSpawnId, botSpawn] of this.botSpawns.entries()) {
      botSpawnsCopy.set(botSpawnId, { ...botSpawn });
    }

    return {
      bots: botSpawnsCopy,
      food: [...this.food],
      width: this.width,
      height: this.height,
    };
  }

  getStats() {
    return {
      stats: this.stats,
      startTime: this.startTime,
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

    bot.x = Math.max(0, Math.min(x, this.width));
    bot.y = Math.max(0, Math.min(y, this.height));
  }

  checkCollisions() {
    let hasCollisions = false;

    // always process smallest first to give them a better chance and
    // make the game more interesting
    const sortedBotSpawns = [...this.botSpawns.values()]
      .sort((a, b) => a.radius - b.radius);

    for (const bot of sortedBotSpawns) {
      if (!this.botSpawns.has(bot.spawnId)) {
        // nothing to do here if the bot was just eaten
        continue;
      }

      const botIdsToRemove: string[] = this.getBotIdsKilledByBot(bot);
      const foodIdxToRemove: number[] = this.getFoodIdsEatenByBot(bot);

      // remove food and bots
      for (const botSpawnIdToRemove of botIdsToRemove) {
        const botToRemove = this.botSpawns.get(botSpawnIdToRemove);
        if (!botToRemove) {
          continue;
        }
        bot.radius = World.getNewEaterRadius(bot.radius, botToRemove.radius);

        this.botIdToSpawnId.delete(botToRemove.botId);
        this.botSpawns.delete(botSpawnIdToRemove);

        this.incrementStat({ botId: bot.botId, stat: "kills" });
        this.incrementStat({ botId: botToRemove.botId, stat: "deaths" });
      }

      // sort in descending order to avoid index shifting when removing elements
      foodIdxToRemove.sort((a, b) => b - a);
      for (const foodIdx of foodIdxToRemove) {
        const foodItem = this.food[foodIdx];
        if (!foodItem) {
          throw new Error("unexpected: food element is undefined");
        }
        bot.radius = World.getNewEaterRadius(bot.radius, foodItem.radius);
        this.food.splice(foodIdx, 1);

        this.incrementStat({ botId: bot.botId, stat: "foodEaten" });
      }

      hasCollisions = hasCollisions || botIdsToRemove.length > 0 || foodIdxToRemove.length > 0;
    }

    return hasCollisions;
  }

  static getNewEaterRadius(eaterRadius: number, eatenRadius: number) {
    // area of a circle = PI * r^2
    const eaterArea = Math.PI * Math.pow(eaterRadius, 2);
    const eatenArea = Math.PI * Math.pow(eatenRadius, 2);
    const newArea = eaterArea + eatenArea;
    return Math.sqrt(newArea / Math.PI);
  }

  getBotIdsKilledByBot(bot: BotSprite): string[] {
    const killedBotIds: string[] = [];
    for (const [otherBotSpawnId, otherBot] of this.botSpawns.entries()) {
      if (otherBotSpawnId === bot.spawnId) {
        continue;
      }
      const distance = World.distance(bot, otherBot);
      if (distance < bot.radius && bot.radius > otherBot.radius) {
        killedBotIds.push(otherBotSpawnId);
      }
    }
    return killedBotIds;
  }

  getFoodIdsEatenByBot(bot: BotSprite): number[] {
    const foodEatenIds: number[] = [];
    for (let i = 0; i < this.food.length; ++i) {
      const foodElement = this.food[i];
      if (!foodElement) {
        throw new Error("unexpected: food element is undefined");
      }
      const distance = World.distance(bot, foodElement);
      if (distance < bot.radius) {
        foodEatenIds.push(i);
      }
    }
    return foodEatenIds;
  }

  incrementStat({ botId, stat }: { botId: string; stat: keyof Stats }) {
    const botStats = this.stats.get(botId);
    if (!botStats) {
      console.error(new Error(`can't find bot stats for botId=${botId}`));
      return;
    }
    botStats[stat] += 1;
  }

  getSpawnId(botId: string) {
    return String(this.botIdToSpawnId.get(botId));
  }
}
