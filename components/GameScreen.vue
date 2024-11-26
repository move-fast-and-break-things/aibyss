<script setup lang="ts">
import { Application, Graphics, Text, FillGradient, Assets, type Texture, Sprite } from "pixi.js";

const refreshIntervalMs = 1000;

const { data: gameState, refresh } = await useFetch("/api/state");
const intervalRef = ref<number | null>(null);

const fishTexturesRef = ref<Texture[]>([]);

onMounted(async () => {
  intervalRef.value = window.setInterval(refresh, refreshIntervalMs);

  fishTexturesRef.value = [
    await Assets.load("/sprites/FishVer1Short.png"),
    await Assets.load("/sprites/FishVer2Short.png"),
    await Assets.load("/sprites/FishVer3Short.png"),
    await Assets.load("/sprites/FishVer4Short.png"),
    await Assets.load("/sprites/FishVer5Short.png"),
    await Assets.load("/sprites/FishVer6Short.png"),
    await Assets.load("/sprites/FishVer7Short.png"),
    await Assets.load("/sprites/FishVer8Short.png"),
    await Assets.load("/sprites/FishVer9Short.png"),
  ];
});

onBeforeUnmount(() => {
  if (intervalRef.value) {
    clearInterval(intervalRef.value);
  }
});

const canvas = ref<HTMLCanvasElement | null>(null);
const appRef = ref<Application | null>(null);
const foodRef = ref<{ x: number; y: number; graphics: Graphics }[]>([]);
const botSpawnsRef = ref<Record<string, Graphics>>({});
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

function isFlipX1(previousPosition: { x: number }, newPosition: { x: number }): boolean {
  if (newPosition.x < previousPosition.x) {
    console.log(previousPosition.x + ", " + newPosition.x);
    return true;
  }
  return false;
}

async function drawBot({ bot, graphics, previousPosition }: DrawBotArgs) {
  for (const child of graphics.children) {
    graphics.removeChild(child);
  }
  graphics.clear();

  // draw bot
  const usernameHash = bot.username.charCodeAt(0) + bot.username.charCodeAt(1) + bot.username.charCodeAt(2);
  const numOfSprite = usernameHash % (fishTexturesRef.value.length);
  const fishTexture = fishTexturesRef.value[numOfSprite];

  if (!fishTexture) {
    throw new Error("Fish sprite is not loaded");
  }
  const sprite = new Sprite(fishTexture);
  sprite.anchor.set(0.5);
  sprite.width = bot.radius * 2;
  sprite.height = bot.radius * 2;
  sprite.x = bot.x;
  sprite.y = bot.y;
  const botFlip1 = isFlipX1(previousPosition, bot);

  if (botFlip1) {
    sprite.scale.x = -Math.abs(sprite.scale.x);
  } /* else {
    sprite.scale.x *= 1; //Math.abs(sprite.scale.x);
  } */

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

    // ensure that larger bots are rendered above the smaller ones
    // this maps better to the metaphor of eating compared to when a smaller
    // bot is rendered above the larger one
    const botsSortedByIncreasingRadius = Object.values(prevState.bots)
      .sort((a, b) => a.radius - b.radius);
    for (const [index, bot] of botsSortedByIncreasingRadius.entries()) {
      const existingBot = botSpawnsRef.value[bot.spawnId];
      if (existingBot) {
        existingBot.zIndex = index;
      }
    }
    appRef.value.stage.sortChildren();
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
    <div
      class="flex flex-col shadow ml-2"
      :style="{ maxWidth: gameState?.width + 'px' }"
    >
      <div class="flex flex-row justify-end mb-2 mt-1 mx-4 gap-6">
        <AnchorLink href="/rating">
          rating
        </AnchorLink>
      </div>
      <canvas ref="canvas" />
    </div>
  </div>
</template>
