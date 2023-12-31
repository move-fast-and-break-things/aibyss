interface Sprite {
  x: number;
  y: number;
  radius: number;
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
  '#FFFF00',
  '#00FFFF',
  '#FF00FF',
];

export default class World {
  private bots: BotSprites = {};
  private food: Sprite[] = [];
  private width: number;
  private height: number;
  private minSpawnDistance = 10;

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
    const newBotRadius = 5;

    const availablePositions = this.getAvailableBotPositions(newBotRadius);

    if (availablePositions.length === 0) {
      throw new Error('No available positions to spawn bot');
    }

    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    const randomPosition = availablePositions[randomIndex];

    const newBot = { ...randomPosition, id, radius: newBotRadius, color: BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)] };
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

  moveBot(id: string, x: number, y: number) {
    const bot = this.bots[id];
    if (!bot) {
      throw new Error(`Bot with id ${id} not found`);
    }
    bot.x = x;
    bot.y = y;
  }
}
