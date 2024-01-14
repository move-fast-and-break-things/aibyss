interface Sprite {
  x: number;
  y: number;
  radius: number;
}

interface Position {
  x: number;
  y: number;
}

export interface BotSprite extends Sprite {
  id: string;
  color: string;
}

type BotSprites = Record<string, BotSprite>;

type WorldArgs = {
  width: number;
  height: number;
};

const BOT_COLORS = [
  '#00FF00',
  '#0000FF',
  '#00FFFF',
  '#FF0000',
  '#114B5F',
  '#E0B0FF',
  '#FFD700',
  '#FF00FF',
  '#FFA500',
];

export default class World {
  private bots: BotSprites = {};
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

  private positionStringify({ x, y }: { x: number, y: number }): string {
    return `${x}-${y}`;
  }

  private positionParse(position: string): { x: number, y: number } {
    const [x, y] = position.split('-');
    return { x: parseInt(x), y: parseInt(y) };
  }

  private getAvailableBotPositions(newBotRadius: number): { x: number, y: number }[] {
    const availablePositions: { x: number, y: number }[] = [];
    const takenPositions: Set<string> = new Set();

    // to avoid computing distances between points when spawning new bots, assume that bots are square
    for (const bot of Object.values(this.bots)) {
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

  addBot(id: string): BotSprite {
    const availablePositions = this.getAvailableBotPositions(this.newBotRadius);

    if (availablePositions.length === 0) {
      throw new Error('No available positions to spawn bot');
    }

    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    const randomPosition = availablePositions[randomIndex];

    const newBot = { ...randomPosition, id, radius: this.newBotRadius, color: BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)] };
    this.bots[id] = newBot;
    return newBot;
  }

  getState() {
    return {
      bots: this.bots,
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

  moveBot(id: string, x: number, y: number) {
    const bot = this.bots[id];
    if (!bot) {
      throw new Error(`Bot with id ${id} not found`);
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
    while (this.checkCollisions(id) && --checkLimit) {};
  }

  checkCollisions(botId: string) {
    const bot = this.bots[botId];
    if (!bot) {
      throw new Error(`Bot with id ${botId} not found`);
    }

    // check if bot eats other bots
    const bots = this.bots;
    const botIdsToRemove: string[] = [];
    for (const [otherBotId, otherBot] of Object.entries(bots)) {
      if (otherBot.id === botId) {
        continue;
      }

      const distance = World.distance(bot, otherBot);
      if (distance < bot.radius && bot.radius > otherBot.radius) {
        botIdsToRemove.push(otherBotId);
      }
    }

    // check if bot eats food
    const food = this.food;
    const foodIdxToRemove: number[] = [];
    for (let i = 0; i < food.length; i++) {
      const distance = World.distance(bot, food[i]);
      if (distance < bot.radius) {
        foodIdxToRemove.push(i);
      }
    }

    // remove food and bots
    for (const botIdToRemove of botIdsToRemove) {
      bot.radius += bots[botIdToRemove].radius;
      delete bots[botIdToRemove];
    }

    for (const foodIdx of foodIdxToRemove) {
      bot.radius += food[foodIdx].radius;
      food.splice(foodIdx, 1);
    }

    return Boolean(botIdsToRemove.length || foodIdxToRemove.length);
  }
}
