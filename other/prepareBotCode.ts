import type { BotCode } from "~/other/botCodeStore";
import type { WorldState } from "~/other/world";

type PrepareBotCodeArgs = {
  bot: BotCode;
  botApi: string;
};

export function prepareBotCode({ bot, botApi }: PrepareBotCodeArgs): string {
  return `
(function () {
  const state = JSON.parse(globalThis._stateJson);
  delete globalThis._stateJson;
  globalThis._player = state.player;
  globalThis._otherPlayers = state.otherPlayers;
  globalThis._food = state.food;
  globalThis._previousOtherPlayersState = state.previousOtherPlayersState;
  globalThis._worldWidth = state.worldWidth;
  globalThis._worldHeight = state.worldHeight;
})();

${bot.code}

${botApi}
`;
}

type PrepareBotStateArgs = {
  bot: BotCode;
  botInfo: Record<string, { username: string }>;
  state: Pick<WorldState, "bots" | "food" | "width" | "height">;
  prevBotState: WorldState["bots"];
};

export function prepareBotState({ bot, botInfo, state, prevBotState }: PrepareBotStateArgs): string {
  const botObject = [...state.bots.values()].find(b => bot.id === b.botId);
  if (!botObject) {
    throw new Error(`Bot with id ${bot.id} not found in the world`);
  }

  const player = { x: botObject.x, y: botObject.y, radius: botObject.radius, username: bot.username };
  const otherPlayers = [...state.bots.values()]
    .filter(b => b.botId !== bot.id)
    .map(b => ({
      x: b.x,
      y: b.y,
      radius: b.radius,
      username: botInfo[b.botId]?.username,
    }));
  const food = state.food.map(f => ({ x: f.x, y: f.y, radius: f.radius }));

  const previousOtherPlayersState = [...prevBotState.values()]
    .filter(b => b.botId !== bot.id)
    .map(b => ({ x: b.x, y: b.y, radius: b.radius, username: botInfo[b.botId]?.username }));

  return JSON.stringify({
    player,
    otherPlayers,
    food,
    previousOtherPlayersState,
    worldWidth: state.width,
    worldHeight: state.height,
  });
}
