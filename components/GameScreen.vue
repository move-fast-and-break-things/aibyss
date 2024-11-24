<script setup lang="ts">
import { Application, Graphics, Text, FillGradient } from "pixi.js";

const refreshIntervalMs = 1000;
const zoomSpeed = 0.05;
const minZoom = 1;
const maxZoom = 3;

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

    let isZoomingOut = false;
    const zoomDuration = 500; // Duration of the zoom-out effect in milliseconds
    let startZoomTime: number | null = null;
    let startMousePos = { x: 0, y: 0 };

    // Functions to handle smooth zoom out
    function smoothZoomOut(mousePos: { x: number; y: number }) {
      if (!appRef.value) {
        return;
      }

      isZoomingOut = true;
      startZoomTime = performance.now();
      startMousePos = mousePos;
      requestAnimationFrame(animateZoomOut);
    }

    function animateZoomOut(currentTime: number) {
      if (!appRef.value || !startZoomTime) {
        return;
      };

      const elapsedTime = currentTime - startZoomTime;
      const progress = Math.min(elapsedTime / zoomDuration, 1);
      const newScale = minZoom + (appRef.value.stage.scale.x - minZoom) * (1 - progress);

      const worldPos = {
        x: (startMousePos.x - appRef.value.stage.position.x) / appRef.value.stage.scale.x,
        y: (startMousePos.y - appRef.value.stage.position.y) / appRef.value.stage.scale.y,
      };

      appRef.value.stage.scale.set(newScale);

      const newScreenPos = {
        x: worldPos.x * newScale + appRef.value.stage.position.x,
        y: worldPos.y * newScale + appRef.value.stage.position.y,
      };

      appRef.value.stage.position.set(
        appRef.value.stage.position.x - (newScreenPos.x - startMousePos.x),
        appRef.value.stage.position.y - (newScreenPos.y - startMousePos.y),
      );

      if (progress < 1) {
        requestAnimationFrame(animateZoomOut);
      } else {
        isZoomingOut = false;
      }
    }

    // Update the mouse wheel event listener
    canvas.value?.addEventListener("wheel", (event) => {
      event.preventDefault();
      const mousePos = { x: event.offsetX, y: event.offsetY };
      if (event.deltaY > 0) {
        // Zoom out when scrolling down
        if (!isZoomingOut) {
          smoothZoomOut(mousePos);
        }
      } else {
        // Existing zoom-in functionality
        const zoomFactor = event.deltaY * -zoomSpeed;
        const newScale = Math.max(minZoom, Math.min(maxZoom, app.stage.scale.x + zoomFactor));

        const worldPos = {
          x: (mousePos.x - app.stage.position.x) / app.stage.scale.x,
          y: (mousePos.y - app.stage.position.y) / app.stage.scale.y,
        };

        app.stage.scale.set(newScale);

        const newScreenPos = {
          x: worldPos.x * newScale + app.stage.position.x,
          y: worldPos.y * newScale + app.stage.position.y,
        };

        app.stage.position.set(
          app.stage.position.x - (newScreenPos.x - mousePos.x),
          app.stage.position.y - (newScreenPos.y - mousePos.y),
        );
      }
    });

    // Panning functionality
    let isDragging = false;
    let startDragPos = { x: 0, y: 0 };

    const mapWidth = 1000; // Replace with actual map width
    const mapHeight = 1000; // Replace with actual map height

    canvas.value?.addEventListener("mousedown", (event) => {
      isDragging = true;
      startDragPos = { x: event.offsetX, y: event.offsetY };
    });

    canvas.value?.addEventListener("mousemove", (event) => {
      if (isDragging && canvas.value) {
        const dx = event.offsetX - startDragPos.x;
        const dy = event.offsetY - startDragPos.y;
        const newPosX = app.stage.position.x + dx;
        const newPosY = app.stage.position.y + dy;

        // Constrain the new position to within map boundaries
        app.stage.position.x = Math.min(0, Math.max(newPosX, canvas.value.width - mapWidth * app.stage.scale.x));
        app.stage.position.y = Math.min(0, Math.max(newPosY, canvas.value.height - mapHeight * app.stage.scale.y));

        startDragPos = { x: event.offsetX, y: event.offsetY };
      }
    });

    canvas.value?.addEventListener("mouseup", () => {
      isDragging = false;
    });

    canvas.value?.addEventListener("mouseleave", () => {
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
