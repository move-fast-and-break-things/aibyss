import { it, expect } from "vitest";
import World, { type BotSprite, type Sprite } from "./world";

it("correctly removes the smaller bot when the bigger bot eats it", () => {
  const world = new World({ width: 100, height: 100 });
  world.addBot("1");
  world.addBot("2");

  // @ts-expect-error - world.bots is private
  const bot1 = world.bots.get("1") as BotSprite;
  bot1.radius = 10;
  bot1.x = 10;
  bot1.y = 10;

  // @ts-expect-error - world.bots is private
  const bot2 = world.bots.get("2") as BotSprite;
  bot2.radius = 5;
  bot2.x = 10;
  bot2.y = 10;

  world.checkCollisions("1");

  // @ts-expect-error - world.bots is private
  expect(world.bots.has("1")).toBe(true);
  // @ts-expect-error - world.bots is private
  expect(world.bots.has("2")).toBe(false);
});

it("correctly removes food when the bot eats it", () => {
  const world = new World({ width: 100, height: 100 });
  world.addBot("1");

  // @ts-expect-error - world.bots is private
  const bot = world.bots.get("1") as BotSprite;
  bot.x = 10;
  bot.y = 10;

  // @ts-expect-error - world.food is private
  expect(world.food.length).toBe(100);

  // @ts-expect-error - world.food is private
  const food = world.food[0] as Sprite;
  food.x = 10;
  food.y = 10;

  world.checkCollisions("1");

  // @ts-expect-error - world.food is private
  expect(world.food.length).toBeLessThan(100);
});

it("shouldn't crash when bot eats two food items and one of them with the last index", () => {
  const world = new World({ width: 100, height: 100 });
  world.addBot("1");

  // @ts-expect-error - world.bots is private
  const bot = world.bots.get("1") as BotSprite;
  bot.x = 10;
  bot.y = 10;

  // @ts-expect-error - world.food is private
  expect(world.food.length).toBe(100);

  // @ts-expect-error - world.food is private
  const food1 = world.food[0] as Sprite;
  food1.x = 10;
  food1.y = 10;

  // @ts-expect-error - world.food is private
  const food2 = world.food[99] as Sprite;
  food2.x = 10;
  food2.y = 10;

  world.checkCollisions("1");

  // @ts-expect-error - world.food is private
  expect(world.food.length).toBeLessThan(100);
});
