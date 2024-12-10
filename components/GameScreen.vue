<script setup lang="ts">
import { Application, Graphics, Text, FillGradient, Assets, type Texture, Sprite } from "pixi.js";

const { data: user } = await useFetch("/api/auth/user");
const refreshIntervalMs = 1000;
const zoomSpeed = 0.1;
const minZoom = 1;
const maxZoom = 3;
let startZoomTime: number;
const zoomDuration = 500;
let targetScale: number;
let targetPos: { x: number; y: number };
let isZooming = false;
const isFollowing = ref<boolean>(false);
const zoomInToPlayerFn = ref<(() => void) | null>(null);

const { data: gameState, refresh } = await useFetch("/api/state");
const intervalRef = ref<number | null>(null);

const fishTexturesRef = ref<Texture[]>([]);

onMounted(async () => {
  intervalRef.value = window.setInterval(refresh, refreshIntervalMs);

  fishTexturesRef.value = await Promise.all([
    Assets.load("/sprites/FishVer1Short.png"),
    Assets.load("/sprites/FishVer2Short.png"),
    Assets.load("/sprites/FishVer3Short.png"),
    Assets.load("/sprites/FishVer4Short.png"),
    Assets.load("/sprites/FishVer5Short.png"),
    Assets.load("/sprites/FishVer6Short.png"),
    Assets.load("/sprites/FishVer7Short.png"),
    Assets.load("/sprites/FishVer8Short.png"),
    Assets.load("/sprites/FishVer9Short.png"),
  ]);
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
  /**
   * Bot direction in radians.
   */
  botDirection: number;
  graphics: Graphics;
};

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
  if (!appRef.value || !appRef.value.stage || !startZoomTime) {
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

function followPlayerBot(x: number, y: number) {
  if (!appRef.value || !gameState.value) {
    throw new Error("unexpected: game not initialized");
  }
  const currentPos = appRef.value.stage.position;
  const targetPos = {
    x: -x * appRef.value.stage.scale.x + appRef.value.screen.width / 2,
    y: -y * appRef.value.stage.scale.y + appRef.value.screen.height / 2,
  };
  const newPosX = currentPos.x + (targetPos.x - currentPos.x) * 0.1;
  const newPosY = currentPos.y + (targetPos.y - currentPos.y) * 0.1;

  appRef.value.stage.position.set(
    Math.min(0, Math.max(newPosX, appRef.value.screen.width - appRef.value.screen.width * appRef.value.stage.scale.x)),
    Math.min(0, Math.max(newPosY, appRef.value.screen.height - appRef.value.screen.height * appRef.value.stage.scale.y)),
  );
}

function toggleFollowMeMode() {
  isFollowing.value = !isFollowing.value;
  zoomInToPlayerFn.value?.();
}

function setSpritePositionAndSize({
  sprite,
  bot: { x, y, radius },
  botDirection,
}: {
  sprite: Sprite;
  bot: { x: number; y: number; radius: number };
  botDirection: number;
}) {
  sprite.x = x;
  sprite.y = y;
  sprite.width = radius * 2;
  sprite.height = radius * 2;
  const shouldFlipBot = botDirection > Math.PI / 2 || botDirection < -Math.PI / 2;
  sprite.scale.x = (shouldFlipBot ? -1 : 1) * Math.abs(sprite.scale.x);
}

function setUsernamePosition({
  username,
  bot: { x, y, radius },
}: {
  username: Text;
  bot: { x: number; y: number; radius: number };
}) {
  username.x = x;
  username.y = y - radius - 10;
}

async function drawBot({ bot, graphics, botDirection }: DrawBotArgs) {
  if (graphics.children.length > 0) {
    const sprite = graphics.children.find(child => child instanceof Sprite);
    const username = graphics.children.find(child => child instanceof Text);
    if (!sprite || !username) {
      throw new Error("unexpected: sprite or text not found when redrawing the bot");
    }
    setSpritePositionAndSize({ sprite, bot, botDirection });
    setUsernamePosition({ username, bot });
    return;
  }

  // draw bot
  const usernameHash = bot.username.charCodeAt(0) + (bot.username.charCodeAt(1) || 0) + (bot.username.charCodeAt(2) || 0);
  const numOfSprite = usernameHash % (fishTexturesRef.value.length);
  const fishTexture = fishTexturesRef.value[numOfSprite];
  if (!fishTexture) {
    throw new Error("Fish sprite is not loaded");
  }
  const sprite = new Sprite(fishTexture);
  sprite.anchor.set(0.5);
  setSpritePositionAndSize({ sprite, bot, botDirection });
  graphics.addChild(sprite);

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
      fontFamily: "Retropix",
      fontSize: 14,
      fontWeight: "100",
      fill: fillGradient,
    },
  });
  setUsernamePosition({ username, bot });

  graphics.addChild(username);
}

function destroyGraphics(graphics: Graphics) {
  for (const child of graphics.children) {
    child.destroy();
  }
  graphics.destroy();
}

function getDirection(
  positionA: { x: number; y: number },
  positionB: { x: number; y: number },
): number {
  return Math.atan2(positionB.y - positionA.y, positionB.x - positionA.x);
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

    // Follow player bot
    function zoomInToPlayer() {
      if (!gameState.value) {
        throw new Error("unexpected: game not initialized");
      }

      let playerBot = null;
      for (const bot of Object.values(gameState.value.bots)) {
        if (bot.username == user.value?.body.username) {
          playerBot = bot;
        }
      }
      if (playerBot) {
        const newScale = (Math.max(minZoom, Math.min(maxZoom, ((app.stage.scale.x + 3) - ((app.stage.scale.x + 3) * ((playerBot?.radius + 10) / 100))))));
        const botPos = { x: playerBot.x, y: playerBot.y };
        if (isFollowing.value) {
          smoothZoom(botPos, newScale);
        } else {
          smoothZoom(botPos, 1);
        }
      }
    }
    zoomInToPlayerFn.value = zoomInToPlayer;

    // Mouse wheel event listener
    // Event listeners can be potentially called multiple times.
    // TODO: add .removeEventListener later for refactoring.
    canvas.value?.addEventListener("wheel", (event) => {
      if (isFollowing.value) {
        return;
      }
      event.preventDefault();
      const mousePos = { x: event.offsetX, y: event.offsetY };
      const zoomFactor = (event.deltaY * -zoomSpeed) * 100;
      const newScale = Math.max(minZoom, Math.min(maxZoom, app.stage.scale.x + zoomFactor));
      smoothZoom(mousePos, newScale);
      if (!isFollowing.value) {
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
      if (!isFollowing.value) {
        if (app.stage.scale.x > 1) {
          gameScreen.value?.classList.add("cursor-grabbing");
        }
        isDragging = true;
        startDragPos = { x: event.offsetX, y: event.offsetY };
      }
    });

    canvas.value?.addEventListener("mousemove", (event) => {
      if (isDragging && canvas.value && !isFollowing.value) {
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
      const newBotState = newState.bots[bot.spawnId];
      if (!newBotState) {
        continue;
      }

      const graphics = new Graphics();
      app.stage.addChild(graphics);
      const botDirection = getDirection(bot, newBotState);
      drawBot({ bot, graphics, botDirection });
      botSpawnsRef.value[bot.spawnId] = graphics;
    }
  } else {
    // remove eaten food
    const foodIdxToRemove: number[] = [];
    for (const [foodIdx, food] of foodRef.value.entries()) {
      if (!prevState.food.find(f => f.x === food.x && f.y === food.y)) {
        foodIdxToRemove.push(foodIdx);
      }
    }
    foodIdxToRemove.reverse();
    for (const idx of foodIdxToRemove) {
      const food = foodRef.value[idx];
      if (!food) {
        throw new Error("unexpected: food to remove not found");
      }
      // `food.graphics` has some weird type
      appRef.value.stage.removeChild(food.graphics as Graphics);
      destroyGraphics(food.graphics as Graphics);
      foodRef.value.splice(idx, 1);
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
        destroyGraphics(existingBotGraphics);
      }
    }

    // move or add bots
    for (const bot of Object.values(prevState.bots)) {
      const newBotState = newState.bots[bot.spawnId];
      if (!newBotState) {
        continue;
      }

      const existingBot = botSpawnsRef.value[bot.spawnId];
      const botDirection = getDirection(bot, newBotState);

      if (existingBot) {
        drawBot({ bot, graphics: existingBot, botDirection });
      } else {
        const graphics = new Graphics();
        appRef.value.stage.addChild(graphics);
        drawBot({ bot, graphics, botDirection });
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
    const progress = Math.min((now - updateTime) / refreshIntervalMs, 1);

    for (const bot of Object.values(newState.bots)) {
      const existingBot = botSpawnsRef.value[bot.spawnId];
      const prevBot = prevState.bots[bot.spawnId];

      if (existingBot && prevBot) {
        const x = prevBot.x + (bot.x - prevBot.x) * progress;
        const y = prevBot.y + (bot.y - prevBot.y) * progress;
        const botDirection = getDirection(prevBot, bot);
        // Follow players bot
        if (isFollowing.value && bot.username == user.value?.body.username) {
          followPlayerBot(x, y);
        }

        drawBot({ bot: { ...bot, x, y }, graphics: existingBot, botDirection });
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
        <ButtonLink @click="toggleFollowMeMode">
          {{ isFollowing ? "stop following my bot" : "follow my bot" }}
        </ButtonLink>
      </div>
      <canvas ref="canvas" />
    </div>
  </div>
</template>
