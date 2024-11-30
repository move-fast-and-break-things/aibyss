import { describe, it, expect } from "vitest";
import World, { type BotSprite, type Sprite } from "./world";

it("correctly removes the smaller bot when the bigger bot eats it", () => {
  const world = new World({ width: 100, height: 100 });
  world.addBot("1");
  world.addBot("2");

  // @ts-expect-error - world.botSpawns is private
  const bot1 = [...world.botSpawns.values()].find(bot => bot.botId === "1") as BotSprite;
  bot1.radius = 10;
  bot1.x = 10;
  bot1.y = 10;

  // @ts-expect-error - world.botSpawns is private
  const bot2 = [...world.botSpawns.values()].find(bot => bot.botId === "2") as BotSprite;
  bot2.radius = 5;
  bot2.x = 10;
  bot2.y = 10;

  world.checkCollisions();

  expect(world.hasBot("1")).toBe(true);
  expect(world.hasBot("2")).toBe(false);
});

it("correctly removes food when the bot eats it", () => {
  const world = new World({ width: 100, height: 100 });
  world.addBot("1");

  // @ts-expect-error - world.botSpawns is private
  const bot = [...world.botSpawns.values()].find(bot => bot.botId === "1") as BotSprite;
  bot.x = 10;
  bot.y = 10;

  // @ts-expect-error - world.food is private
  expect(world.food.length).toBe(200);

  // @ts-expect-error - world.food is private
  const food = world.food[0] as Sprite;
  food.x = 10;
  food.y = 10;

  world.checkCollisions();

  // @ts-expect-error - world.food is private
  expect(world.food.length).toBeLessThan(200);
});

it("shouldn't crash when bot eats two food items and one of them with the last index", () => {
  const world = new World({ width: 100, height: 100 });
  world.addBot("1");

  // @ts-expect-error - world.botSpawns is private
  const bot = [...world.botSpawns.values()].find(bot => bot.botId === "1") as BotSprite;
  bot.x = 10;
  bot.y = 10;

  // @ts-expect-error - world.food is private
  expect(world.food.length).toBe(200);

  // @ts-expect-error - world.food is private
  const food1 = world.food[0] as Sprite;
  food1.x = 10;
  food1.y = 10;

  // @ts-expect-error - world.food is private
  const food2 = world.food[99] as Sprite;
  food2.x = 10;
  food2.y = 10;

  world.checkCollisions();

  // @ts-expect-error - world.food is private
  expect(world.food.length).toBeLessThan(200);
});

it("doesn't allow the bot to go outside the world with large x and y", () => {
  const world = new World({ width: 100, height: 100 });
  world.addBot("1");

  // @ts-expect-error - world.botSpawns is private
  const bot = [...world.botSpawns.values()].find(bot => bot.botId === "1") as BotSprite;
  bot.x = 100;
  bot.y = 100;

  const worldStateBeforeMove = world.getState();
  const botsBeforeMove = [...worldStateBeforeMove.bots.values()];
  const botFromStateBeforeMove = botsBeforeMove[0];
  if (!botFromStateBeforeMove) {
    throw new Error("Bot not found in the state");
  }
  expect(botFromStateBeforeMove.x).toBe(100);
  expect(botFromStateBeforeMove.y).toBe(100);

  world.moveBot("1", 101, 101);
  world.checkCollisions();

  const worldStateAfterMove = world.getState();
  const botsAfterMove = [...worldStateAfterMove.bots.values()];
  const botFromStateAfterMove = botsAfterMove[0];
  if (!botFromStateAfterMove) {
    throw new Error("Bot not found in the state");
  }
  expect(botFromStateAfterMove.x).toBe(100);
  expect(botFromStateAfterMove.y).toBe(100);
});

it("doesn't allow the bot to go outside the world with negative x and y", () => {
  const world = new World({ width: 100, height: 100 });
  world.addBot("1");

  // @ts-expect-error - world.botSpawns is private
  const bot = [...world.botSpawns.values()].find(bot => bot.botId === "1") as BotSprite;
  bot.x = 0;
  bot.y = 0;

  const worldStateBeforeMove = world.getState();
  const botsBeforeMove = [...worldStateBeforeMove.bots.values()];
  const botFromStateBeforeMove = botsBeforeMove[0];
  if (!botFromStateBeforeMove) {
    throw new Error("Bot not found in the state");
  }
  expect(botFromStateBeforeMove.x).toBe(0);
  expect(botFromStateBeforeMove.y).toBe(0);

  world.moveBot("1", -1, -1);
  world.checkCollisions();

  const worldStateAfterMove = world.getState();
  const botsAfterMove = [...worldStateAfterMove.bots.values()];
  const botFromStateAfterMove = botsAfterMove[0];
  if (!botFromStateAfterMove) {
    throw new Error("Bot not found in the state");
  }
  expect(botFromStateAfterMove.x).toBe(0);
  expect(botFromStateAfterMove.y).toBe(0);
});

describe(".serializePosition", () => {
  it("returns the same value for the same position", () => {
    // @ts-expect-error - world.serializePosition is private
    expect(World.serializePosition({ x: 1, y: 1 })).toBe(World.serializePosition({ x: 1, y: 1 }));
    // @ts-expect-error - world.serializePosition is private
    expect(World.serializePosition({ x: 15212, y: 102 })).toBe(World.serializePosition({ x: 15212, y: 102 }));
  });

  it("returns a unique value for each position on a 1000x1000 grid", () => {
    const positions = new Set<number>();
    for (let x = 0; x < 1000; ++x) {
      for (let y = 0; y < 1000; ++y) {
        // @ts-expect-error - world.serializePosition is private
        positions.add(World.serializePosition({ x, y }));
      }
    }
    expect(positions.size).toBe(1000 * 1000);
  });

  it("returns unique values for large coordinates, just below 65535", () => {
    // @ts-expect-error - world.serializePosition is private
    expect(World.serializePosition({ x: 65534, y: 65534 })).toBe(-65538);
    // @ts-expect-error - world.serializePosition is private
    expect(World.serializePosition({ x: 65534, y: 65535 })).toBe(-2);
    // @ts-expect-error - world.serializePosition is private
    expect(World.serializePosition({ x: 65535, y: 65534 })).toBe(-65537);
    // @ts-expect-error - world.serializePosition is private
    expect(World.serializePosition({ x: 65535, y: 65535 })).toBe(-1);
  });
});

describe(".deserializePosition", () => {
  it("can deserialize every serialized position on a 1000x1000 grid", () => {
    const position = { x: 0, y: 0 };
    for (; position.x < 1000; ++position.x) {
      for (; position.y < 1000; ++position.y) {
        // @ts-expect-error - world.deserializePosition is private
        const serializedPosition = World.serializePosition(position);
        // @ts-expect-error - world.deserializePosition is private
        const deserializedPosition = World.deserializePosition(serializedPosition);
        expect(deserializedPosition).toStrictEqual(position);
      }
    }
  });

  it("can deserialize large coordinates, just below 65535", () => {
    // @ts-expect-error - world.deserializePosition is private
    expect(World.deserializePosition(World.serializePosition({ x: 65534, y: 65534 }))).toEqual({ x: 65534, y: 65534 });
    // @ts-expect-error - world.deserializePosition is private
    expect(World.deserializePosition(World.serializePosition({ x: 65534, y: 65535 }))).toEqual({ x: 65534, y: 65535 });
    // @ts-expect-error - world.deserializePosition is private
    expect(World.deserializePosition(World.serializePosition({ x: 65535, y: 65534 }))).toEqual({ x: 65535, y: 65534 });
    // @ts-expect-error - world.deserializePosition is private
    expect(World.deserializePosition(World.serializePosition({ x: 65535, y: 65535 }))).toEqual({ x: 65535, y: 65535 });
  });
});

describe(".getAvailableSpawnPositions", () => {
  it("returns all available positions if there are no bots", () => {
    const worldSize = 100;

    const world = new World({ width: worldSize, height: worldSize });

    const newEntityRadius = 1;
    // @ts-expect-error - world.getAvailableSpawnPositions is private
    const availablePositions = world.getAvailableSpawnPositions(newEntityRadius);
    // we step away from the walls by the radius of the new entity
    expect(availablePositions.length).toEqual((worldSize - newEntityRadius * 2) * (worldSize - newEntityRadius * 2));
  });

  it("returns fewer positions than there are on the grid because bot occupy some", () => {
    const worldSize = 100;

    const world = new World({ width: worldSize, height: worldSize });
    world.addBot("1");

    const newEntityRadius = 1;
    // @ts-expect-error - world.getAvailableSpawnPositions is private
    const availablePositions = world.getAvailableSpawnPositions(newEntityRadius);
    // we step away from the walls by the radius of the new entity
    expect(availablePositions.length).toBeLessThan((worldSize - newEntityRadius * 2) * (worldSize - newEntityRadius * 2));
  });

  it("doesn't return nullish elements when there is a bot", () => {
    const worldSize = 100;

    const world = new World({ width: worldSize, height: worldSize });
    world.addBot("1");

    const newEntityRadius = 1;
    // @ts-expect-error - world.getAvailableSpawnPositions is private
    const availablePositions = world.getAvailableSpawnPositions(newEntityRadius);
    expect([...availablePositions].every(Boolean)).toBe(true);
  });

  it("doesn't return nullish elements when there are no bots", () => {
    const world = new World({ width: 100, height: 100 });
    const newEntityRadius = 1;
    // @ts-expect-error - world.getAvailableSpawnPositions is private
    const availablePositions = world.getAvailableSpawnPositions(newEntityRadius);
    expect([...availablePositions].every(Boolean)).toBe(true);
  });
});
