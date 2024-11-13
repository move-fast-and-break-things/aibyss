<script setup lang="ts">
import { Application, Graphics, Text, FillGradient, Assets, type Texture, Sprite, Color } from "pixi.js";

const refreshIntervalMs = 1000;

const { data: gameState, refresh } = await useFetch("/api/state");
const intervalRef = ref<number | null>(null);

const fishRef1 = ref<Texture | null>(null);
const fishRef2 = ref<Texture | null>(null);
const fishRef3 = ref<Texture | null>(null);
const fishRef4 = ref<Texture | null>(null);
const fishRef5 = ref<Texture | null>(null);
const fishRef6 = ref<Texture | null>(null);
const fishRef7 = ref<Texture | null>(null);
const fishRef8 = ref<Texture | null>(null);
const fishRef9 = ref<Texture | null>(null);
const masRef = Array.from({ length: 9 }, () => ref<Texture | null>(null));

onMounted(async () => {
  intervalRef.value = window.setInterval(refresh, refreshIntervalMs);

  fishRef1.value = await Assets.load("/sprites/FishVer1Short.png");
  masRef[0] = fishRef1;
  fishRef2.value = await Assets.load("/sprites/FishVer2Short.png");
  masRef[1] = fishRef2;
  fishRef3.value = await Assets.load("/sprites/FishVer3Short.png");
  masRef[2] = fishRef3;
  fishRef4.value = await Assets.load("/sprites/FishVer4Short.png");
  masRef[3] = fishRef4;
  fishRef5.value = await Assets.load("/sprites/FishVer5Short.png");
  masRef[4] = fishRef5;
  fishRef6.value = await Assets.load("/sprites/FishVer6Short.png");
  masRef[5] = fishRef6;
  fishRef7.value = await Assets.load("/sprites/FishVer7Short.png");
  masRef[6] = fishRef7;
  fishRef8.value = await Assets.load("/sprites/FishVer8Short.png");
  masRef[6] = fishRef8;
  fishRef9.value = await Assets.load("/sprites/FishVer9Short.png");
  masRef[6] = fishRef9;

});

onBeforeUnmount(() => {
  if (intervalRef.value) {
    clearInterval(intervalRef.value);
  }
});

const canvas = ref<HTMLCanvasElement | null>(null);
const appRef = ref<Application | null>(null);
const foodRef = ref<{ x: number; y: number; graphics: Graphics }[]>([]);
const botSpawnsRef = ref<Record<string, Graphics>>({})
const tickFnRef = ref<() => void>();

type DrawBotArgs = {
  bot: {
    x: number;
    y: number;
    radius: number;
    color: string;
    username: string;
  };
  previousPosition: {
    x: number;
    y: number;
  };
  graphics: Graphics;
};

function getDirectionAngle(previousPosition: { x: number; y: number }, newPosition: { x: number; y: number }): number {
  return Math.atan2(newPosition.y - previousPosition.y, newPosition.x - previousPosition.x);
}
function isFlipX1(previousPosition: { x: number;}, newPosition: { x: number;}): boolean{
  if (newPosition.x <= previousPosition.x) {
    return true;
  } else {
    return false;
  }
}
function isFlipX2(previousPosition: { x: number;}, newPosition: { x: number;}): boolean{
  if (newPosition.x > previousPosition.x) {
    return true;
  } else {
    return false;
  }
}
let i = 1;
async function drawBot({ bot, graphics, previousPosition }: DrawBotArgs) {
  for (const child of graphics.children) {
    graphics.removeChild(child);
  }
  graphics.clear();

  // draw bot
  const usernameHash = bot.username.charCodeAt(0) + bot.username.charCodeAt(1) + bot.username.charCodeAt(2);
  const numOfSprite = usernameHash % (masRef.length);
  if (!masRef[numOfSprite]) {
    throw new Error("Fish sprite is not loaded");
  }
  const fishTexture = masRef[numOfSprite].value;
  
  if (!fishTexture) {
    throw new Error("Fish sprite is not loaded");
  }
  let sprite = new Sprite(fishTexture);
  sprite.anchor.set(0.5);
  sprite.width = bot.radius * 2;
  sprite.height = bot.radius * 2;
  sprite.x = bot.x;
  sprite.y = bot.y;
  //let botRot = getDirectionAngle(previousPosition,bot);
  let botFlip1 = isFlipX1(previousPosition,bot);
  let botFlip2 = isFlipX2(previousPosition,bot);
  //debugger;
  if (botFlip1 && (sprite.scale.x >= 0)) {
    sprite.scale.x *= -1;
  } else if (botFlip2 && (sprite.scale.x <= 0)) {
    sprite.scale.x *= -1;
  }
  graphics.addChild(sprite);
  const existingUsername = graphics.children.find(child => child instanceof Text);
  if (existingUsername) {
    // avoid recreating username if it already exists
    existingUsername.x = bot.x;
    existingUsername.y = bot.y - bot.radius - 10;
  } else {
    // draw username

    // we have to use FillGradient because
    // using color as a fill doesn't work with pixi.js, vue.js, and Text
    // https://github.com/pixijs/pixijs/discussions/10444
    const fillGradient = new FillGradient(0, 0, 1, 1);
    fillGradient.addColorStop(0, bot.color);
    fillGradient.addColorStop(1, bot.color);

    const username = new Text({
      anchor: {
        x: 0.5,
        y: 0.5,
      },
      text: bot.username,
      style: {
        fontFamily: "Verdana",
        fontSize: 12,
        fontWeight: "100",
        fill: fillGradient,
      },
    });
    username.x = bot.x;
    username.y = bot.y - bot.radius - 10;

    graphics.addChild(username);
  }
}

watch(gameState, async (newState, prevState) => {
  if (!canvas.value) {
    window.alert("Can't render the game. Please, refresh the page. If the problem persists, report the issue at https://github.com/move-fast-and-break-things/aibyss/issues. Include as many details as possible.");
    return;
  }

  if (!prevState || !newState) {
    return;
  }

  if (tickFnRef.value) {
    appRef.value?.ticker.remove(tickFnRef.value);
  }

  if (!appRef.value || appRef.value.renderer.width !== prevState.width || appRef.value.renderer.height !== prevState.height) {
    appRef.value?.destroy();

    const app = new Application();
    appRef.value = app;

    await app.init({
      width: prevState.width,
      height: prevState.height,
      canvas: canvas.value,
      backgroundColor: "#FFFFFF",
      antialias: true,
      resolution: 4,
      autoDensity: true,
    });

    // render food
    for (const food of prevState.food) {
      const graphics = new Graphics();
      graphics.circle(food.x, food.y, food.radius);
      graphics.fill("#FF0000");
      app.stage.addChild(graphics);
      foodRef.value.push({ x: food.x, y: food.y, graphics });
    }

    // render bots
    for (const bot of Object.values(prevState.bots)) {
      const graphics = new Graphics();
      app.stage.addChild(graphics);
      drawBot({ bot, graphics, previousPosition: bot });
      botSpawnsRef.value[bot.spawnId] = graphics;
    }
  } else {
    // remove eaten food
    for (const food of foodRef.value) {
      if (!prevState.food.find(f => f.x === food.x && f.y === food.y)) {
        // @ts-expect-error - food.graphics has some weird type
        appRef.value.stage.removeChild(food.graphics);
      }
    }

    // add new food
    for (const food of prevState.food) {
      if (!foodRef.value.find(f => f.x === food.x && f.y === food.y)) {
        const graphics = new Graphics();
        graphics.circle(food.x, food.y, food.radius);
        graphics.fill("#FF0000");
        appRef.value.stage.addChild(graphics);
        foodRef.value.push({ x: food.x, y: food.y, graphics });
      }
    }

    // remove eaten bots
    for (const spawnId of Object.keys(botSpawnsRef.value)) {
      const existingBotGraphics = botSpawnsRef.value[spawnId];
      if (existingBotGraphics && !newState.bots[spawnId]) {
        appRef.value.stage.removeChild(existingBotGraphics);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete botSpawnsRef.value[spawnId];
      }
    }

    // move or add bots
    for (const bot of Object.values(prevState.bots)) {
      if (!newState.bots[bot.spawnId]) {
        continue;
      }

      const existingBot = botSpawnsRef.value[bot.spawnId];

      if (existingBot) {
        drawBot({ bot, graphics: existingBot, previousPosition: bot });
      } else {
        const graphics = new Graphics();
        appRef.value.stage.addChild(graphics);
        drawBot({ bot, graphics, previousPosition: bot });
        botSpawnsRef.value[bot.spawnId] = graphics;
      }
    }
  }

  // slowly move the bots from prevState to newState during the refresh interval
  const updateTime = Date.now();
  tickFnRef.value = () => {
    const now = Date.now();
    const progress = (now - updateTime) / refreshIntervalMs;

    for (const bot of Object.values(newState.bots)) {
      const existingBot = botSpawnsRef.value[bot.spawnId];
      const prevBot = prevState.bots[bot.spawnId];

      if (existingBot && prevBot) {
        const x = prevBot.x + (bot.x - prevBot.x) * progress;
        const y = prevBot.y + (bot.y - prevBot.y) * progress;

        drawBot({ bot: { ...bot, x, y }, graphics: existingBot, previousPosition: prevBot });
      }
    }
  };
  appRef.value.ticker.add(tickFnRef.value);
});
</script>

<template>
  <div
    class="h-full w-full"
    data-testid="game-screen"
  >
    <canvas
      ref="canvas"
      class="shadow m-4 mt-0"
    />
  </div>
</template>
