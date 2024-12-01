<script setup lang="ts">
import { Application, Graphics, Text, FillGradient } from "pixi.js";

const refreshIntervalMs = 1000;
const zoomSpeed = 0.1;
const minZoom = 1;
const maxZoom = 3;
let startZoomTime: number;
const zoomDuration = 500;
let targetScale: number;
let targetPos: { x: number; y: number };
let isZooming = false;
let isFollowing = false;

const { data: gameState, refresh } = await useFetch("/api/state");
const intervalRef = ref<number | null>(null);

onMounted(async () => {
  intervalRef.value = window.setInterval(refresh, refreshIntervalMs);
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
const gameScreen = ref<HTMLDivElement | null>(null);

const tickFnRef = ref<() => void>();

type DrawBotArgs = {
  bot: {
    x: number;
    y: number;
    radius: number;
    color: string;
    username: string;
  };
  graphics: Graphics;
};

function follow() {
  isFollowing = !isFollowing;
  if (!gameState.value) {
    return;
  }
  const firstBot = Object.values(gameState.value.bots)[0];
  if (firstBot) {
    const botPos = { x: firstBot.x, y: firstBot.y };
    if (isFollowing) {
      smoothZoom(botPos, 3);
    } else {
      smoothZoom(botPos, 1);
    }
  }
}

function smoothZoom(Pos: { x: number; y: number }, scale: number) {
  if (!appRef.value) {
    return;
  }

  if (isZooming) {
    return; // Prevent multiple simultaneous zooms
  }
  isZooming = true;
  targetScale = scale;
  targetPos = Pos;
  startZoomTime = performance.now();

  requestAnimationFrame(animateZoom);
}

function animateZoom(currentTime: number) {
  if (!appRef.value || !startZoomTime || !appRef.value.stage) {
    return;
  }

  const elapsedTime = currentTime - startZoomTime;
  const progress = Math.min(elapsedTime / zoomDuration, 1);

  // Get the current scale and the scale change based on progress
  const currentScale = appRef.value.stage.scale.x;
  const newScale = currentScale + (targetScale - currentScale) * progress;

  // Calculate the world position relative to the current scale
  const worldPos = {
    x: (targetPos.x - appRef.value.stage.position.x) / appRef.value.stage.scale.x,
    y: (targetPos.y - appRef.value.stage.position.y) / appRef.value.stage.scale.y,
  };

  appRef.value.stage.scale.set(newScale);

  const newScreenPos = {
    x: worldPos.x * newScale + appRef.value.stage.position.x,
    y: worldPos.y * newScale + appRef.value.stage.position.y,
  };

  // Adjust the stage position to follow the zoom focus point
  appRef.value.stage.position.set(
    Math.min(0, Math.max(appRef.value.stage.position.x - (newScreenPos.x - targetPos.x), appRef.value.screen.width - appRef.value.screen.width * newScale)),
    Math.min(0, Math.max(appRef.value.stage.position.y - (newScreenPos.y - targetPos.y), appRef.value.screen.height - appRef.value.screen.height * newScale)),
  );

  if (progress < 1) {
    requestAnimationFrame(animateZoom);
  } else {
    isZooming = false;
  }
}
function followFirstBot(botx: number, boty: number, username: string) {
  if (!appRef.value || !gameState.value) {
    console.error("App or game state not initialized.");
    return;
  }

  const firstBot = Object.values(gameState.value.bots)?.[0];
  if (!firstBot) {
    console.warn("No bots available to follow.");
    return;
  }
  if (username == firstBot.username) {
    const currentPos = appRef.value.stage.position;
    const targetPos = {
      x: -botx * appRef.value.stage.scale.x + appRef.value.screen.width / 2,
      y: -boty * appRef.value.stage.scale.y + appRef.value.screen.height / 2,
    };
    const newPosX = currentPos.x + (targetPos.x - currentPos.x) * 0.1;
    const newPosY = currentPos.y + (targetPos.y - currentPos.y) * 0.1;

    appRef.value.stage.position.set(
      Math.min(0, Math.max(newPosX, appRef.value.screen.width - appRef.value.screen.width * appRef.value.stage.scale.x)),
      Math.min(0, Math.max(newPosY, appRef.value.screen.height - appRef.value.screen.height * appRef.value.stage.scale.y)),
    );
  }
}

async function drawBot({ bot, graphics }: DrawBotArgs) {
  graphics.clear();

  // draw bot
  graphics.circle(bot.x, bot.y, bot.radius);
  graphics.fill(bot.color);

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

    // Adjust username text scale to prevent zooming effect
    const stageScale = appRef.value?.stage.scale.x ?? 1;
    username.scale.set(1 / stageScale, 1 / stageScale);
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

    // Mouse wheel event listener
    // Event listeners can be potentially called multiple times.
    // TODO: add .removeEventListener later for refactoring.
    canvas.value?.addEventListener("wheel", (event) => {
      event.preventDefault();
      const mousePos = { x: event.offsetX, y: event.offsetY };
      const zoomFactor = (event.deltaY * -zoomSpeed) * 100;
      const newScale = Math.max(minZoom, Math.min(maxZoom, app.stage.scale.x + zoomFactor));
      smoothZoom(mousePos, newScale);
      if (!isFollowing) {
        if (newScale > 1) {
          gameScreen.value?.classList.add("cursor-grab");
        } else {
          gameScreen.value?.classList.remove("cursor-grab");
        }
      }
    });

    // Panning functionality
    let isDragging = false;
    let startDragPos = { x: 0, y: 0 };

    canvas.value?.addEventListener("mousedown", (event) => {
      if (!isFollowing) {
        if (app.stage.scale.x > 1) {
          gameScreen.value?.classList.add("cursor-grabbing");
        }
        isDragging = true;
        startDragPos = { x: event.offsetX, y: event.offsetY };
      }
    });

    canvas.value?.addEventListener("mousemove", (event) => {
      if (isDragging && canvas.value && !isFollowing) {
        const dx = event.offsetX - startDragPos.x;
        const dy = event.offsetY - startDragPos.y;
        const newPosX = app.stage.position.x + dx;
        const newPosY = app.stage.position.y + dy;

        // Constrain the new position to within map boundaries
        app.stage.position.x = Math.min(0, Math.max(newPosX, app.screen.width - app.screen.width * app.stage.scale.x));
        app.stage.position.y = Math.min(0, Math.max(newPosY, app.screen.height - app.screen.height * app.stage.scale.y));

        startDragPos = { x: event.offsetX, y: event.offsetY };
      }
    });

    canvas.value?.addEventListener("mouseup", () => {
      gameScreen.value?.classList.remove("cursor-grabbing");
      isDragging = false;
    });

    canvas.value?.addEventListener("mouseleave", () => {
      gameScreen.value?.classList.remove("cursor-grabbing");
      isDragging = false;
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
      drawBot({ bot, graphics });
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
        drawBot({ bot, graphics: existingBot });
      } else {
        const graphics = new Graphics();
        appRef.value.stage.addChild(graphics);
        drawBot({ bot, graphics });
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
        // follow bot
        if (isFollowing) {
          followFirstBot(x, y, bot.username);
        }

        drawBot({ bot: { ...bot, x, y }, graphics: existingBot });
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
      ref="gameScreen"
      class="flex flex-col shadow ml-2"
      :style="{ maxWidth: gameState?.width + 'px' }"
    >
      <div class="flex flex-row justify-end mb-2 mt-1 mx-4 gap-6">
        <ButtonLink
          @click="follow"
        >
          Follow Bot
        </ButtonLink>
        <AnchorLink href="/rating">
          rating
        </AnchorLink>
      </div>
      <canvas ref="canvas" />
    </div>
  </div>
</template>
