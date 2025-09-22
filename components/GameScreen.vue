<script setup lang="ts">
import { Application, Graphics, Text, FillGradient, Assets, type Texture, Sprite } from "pixi.js";
import { getSmoothZoomScreen, followPlayerBot, getZoomScale } from "~/other/zoomUtils";
import getRandomElement from "~/other/getRandomElement";

type Food = { x: number; y: number; graphics: Graphics };

const { data: user } = await useFetch("/api/auth/user");
const refreshIntervalMs = 1000;
const zoomSpeed = 0.1;
const minZoom = 1;
const maxZoom = 3;
const isFollowing = ref<boolean>(false);
const isDebugMode = ref<boolean>(false);
const zoomInToPlayerOrResetZoomFn = ref<(() => void) | null>(null);

const { data: gameState, refresh } = await useFetch("/api/state");
const intervalRef = ref<number | null>(null);

const fishTexturesRef = ref<Texture[]>([]);
const foodTexturesRef = ref<Texture[]>([]);

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
  foodTexturesRef.value = await Promise.all([
    Assets.load("/sprites/FishFoodVer1.png"),
    Assets.load("/sprites/FishFoodVer3.png"),
    Assets.load("/sprites/FishFoodVer4.png"),
  ]);
});

onBeforeUnmount(() => {
  if (intervalRef.value) {
    clearInterval(intervalRef.value);
  }
});

const canvas = ref<HTMLCanvasElement | null>(null);
const appRef: Ref<Application | null> = ref(null);
const foodRef = ref<Food[]>([]);
const botSpawnsRef = ref<Record<string, Graphics>>({});
const gameScreen = ref<HTMLDivElement | null>(null);

const smoothZoomScreen = getSmoothZoomScreen(appRef);

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

function toggleFollowMeMode() {
  isFollowing.value = !isFollowing.value;
  zoomInToPlayerOrResetZoomFn.value?.();
}

function toggleDebugMode() {
  isDebugMode.value = !isDebugMode.value;
  
  // Redraw all bots with the new rendering mode
  if (gameState.value && gameState.value.bots) {
    for (const [spawnId, bot] of Object.entries(gameState.value.bots)) {
      const graphics = botSpawnsRef.value[spawnId];
      if (graphics) {
        // Save the username text element
        const usernameText = graphics.children.find(child => child instanceof Text);
        
        // Clear existing children
        for (const child of graphics.children) {
          if (!(child instanceof Text)) {
            child.destroy();
          }
        }
        
        // Remove non-text children
        graphics.removeChildren(0, graphics.children.length, false);
        
        // Add back the username text if it exists
        if (usernameText) {
          graphics.addChild(usernameText);
        }
        
        // Draw the new visual representation
        if (isDebugMode.value) {
          // Draw a circle with direction indicator in debug mode
          const circle = new Graphics();
          
          // Main circle
          circle.beginFill(bot.color);
          circle.drawCircle(0, 0, bot.radius);
          circle.endFill();
          
          // Find the direction based on previous position if possible
          const prevSpawnId = Object.keys(botSpawnsRef.value).find(id => id === spawnId);
          const prevBotState = prevSpawnId ? gameState.value?.bots[prevSpawnId] : null;
          let direction = 0;
          
          if (prevBotState) {
            direction = getDirection(prevBotState, bot);
          }
          
          // Direction indicator (a small line pointing in the direction of movement)
          circle.lineStyle(2, 0xFFFFFF);
          circle.moveTo(0, 0);
          const indicatorLength = bot.radius * 1.2;
          circle.lineTo(
            Math.cos(direction) * indicatorLength,
            Math.sin(direction) * indicatorLength
          );
          
          circle.position.set(bot.x, bot.y);
          graphics.addChildAt(circle, 0);
        } else {
          // Draw sprite in normal mode
          const usernameHash = bot.username.charCodeAt(0) + (bot.username.charCodeAt(1) || 0) + (bot.username.charCodeAt(2) || 0);
          const numOfSprite = usernameHash % (fishTexturesRef.value.length);
          const fishTexture = fishTexturesRef.value[numOfSprite];
          if (!fishTexture) {
            throw new Error("Fish sprite is not loaded");
          }
          const sprite = new Sprite(fishTexture);
          sprite.anchor.set(0.5);
          setSpritePositionAndSize({ sprite, bot, botDirection: 0 });
          graphics.addChildAt(sprite, 0);
        }
      }
    }
  }
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
    const botVisual = graphics.children.find(child => child instanceof Sprite || child instanceof Graphics);
    const username = graphics.children.find(child => child instanceof Text);
    if (!botVisual || !username) {
      throw new Error("unexpected: visual element or text not found when redrawing the bot");
    }
    
    if (botVisual instanceof Sprite) {
      setSpritePositionAndSize({ sprite: botVisual, bot, botDirection });
    } else if (botVisual instanceof Graphics) {
      // Update circle position and direction indicator
      botVisual.position.set(bot.x, bot.y);
      
      // Redraw the direction indicator
      if (isDebugMode.value) {
        // Clear previous graphics
        botVisual.clear();
        
        // Redraw circle
        botVisual.beginFill(bot.color);
        botVisual.drawCircle(0, 0, bot.radius);
        botVisual.endFill();
        
        // Redraw direction indicator
        botVisual.lineStyle(2, 0xFFFFFF);
        botVisual.moveTo(0, 0);
        const indicatorLength = bot.radius * 1.2;
        botVisual.lineTo(
          Math.cos(botDirection) * indicatorLength,
          Math.sin(botDirection) * indicatorLength
        );
      }
    }
    
    setUsernamePosition({ username, bot });
    return;
  }

  // draw bot
  if (isDebugMode.value) {
    // Draw a circle with direction indicator in debug mode
    const circle = new Graphics();
    
    // Main circle
    circle.beginFill(bot.color);
    circle.drawCircle(0, 0, bot.radius);
    circle.endFill();
    
    // Direction indicator (a small line pointing in the direction of movement)
    circle.lineStyle(2, 0xFFFFFF);
    circle.moveTo(0, 0);
    const indicatorLength = bot.radius * 1.2;
    circle.lineTo(
      Math.cos(botDirection) * indicatorLength,
      Math.sin(botDirection) * indicatorLength
    );
    
    circle.position.set(bot.x, bot.y);
    graphics.addChild(circle);
  } else {
    // Draw sprite in normal mode
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
  }

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

function addFoodGraphics(food: { x: number; y: number; radius: number }) {
  if (!appRef.value) {
    throw new Error("We didn't find appRef.value.");
  }
  const graphics = new Graphics();
  const foodTexture = getRandomElement(foodTexturesRef.value).element;

  if (!foodTexture) {
    throw new Error("Fish sprite is not loaded");
  }

  const sprite = new Sprite(foodTexture);
  sprite.anchor.set(0.5);
  sprite.x = food.x;
  sprite.y = food.y;
  sprite.width = food.radius * 2;
  sprite.height = food.radius * 2;

  graphics.addChild(sprite);
  appRef.value.stage.addChild(graphics);

  foodRef.value.push({ x: food.x, y: food.y, graphics });
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
        const newScale = getZoomScale({ minZoom, maxZoom, stageScale: app.stage.scale.x, playerRadius: playerBot?.radius || 0 });
        const botPos = { x: playerBot.x, y: playerBot.y };
        if (isFollowing.value) {
          smoothZoomScreen({ pos: botPos, scale: newScale });
        } else {
          smoothZoomScreen({ pos: botPos, scale: 1 });
        }
      }
    }
    zoomInToPlayerOrResetZoomFn.value = zoomInToPlayer;

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
      smoothZoomScreen({ pos: mousePos, scale: newScale });
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
      addFoodGraphics(food);
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
        addFoodGraphics(food);
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
          followPlayerBot({ appRef, x, y });
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
        <ButtonLink
          v-if="user?.body"
          @click="toggleFollowMeMode"
        >
          {{ isFollowing ? "stop following my bot" : "follow my bot" }}
        </ButtonLink>
        <ButtonLink
          @click="toggleDebugMode"
          data-testid="debug-mode-toggle"
          class="bg-amber-500 hover:bg-amber-600"
        >
          {{ isDebugMode ? "show sprites" : "show circles (debug)" }}
        </ButtonLink>
      </div>
      <canvas ref="canvas" />
    </div>
  </div>
</template>
