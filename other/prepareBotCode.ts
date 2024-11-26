import type { BotCode } from "~/other/botCodeStore";
import type { WorldState } from "~/other/world";

type PrepareBotCodeArgs = {
  bot: BotCode;
  botInfo: Record<string, { username: string }>;
  state: Pick<WorldState, "bots" | "food" | "width" | "height">;
  prevBotState: WorldState["bots"];
  botApi: string;
};

export default function prepareBotCode({ bot, botInfo, state, prevBotState, botApi }: PrepareBotCodeArgs): string {
  const { code, username } = bot;

  const botObject = [...state.bots.values()].find(b => bot.id === b.botId);
  if (!botObject) {
    throw new Error(`Bot with id ${bot.id} not found in the world`);
  }

  const me = { x: botObject.x, y: botObject.y, radius: botObject.radius, username };
  const otherPlayers = [...state.bots.values()]
    .filter(b => b.botId !== bot.id)
    .map(b => ({
      x: b.x,
      y: b.y,
      radius: b.radius,
      username: botInfo[b.botId]?.username,
    }));
  const food = state.food.map(f => ({ x: f.x, y: f.y, radius: f.radius }));

  const prevOtherPlayers = [...prevBotState.values()]
    .filter(b => b.botId !== bot.id)
    .map(b => ({ x: b.x, y: b.y, radius: b.radius, username: botInfo[b.botId]?.username }));

  const preparedCode = `
global._player = ${JSON.stringify(me)};
global._otherPlayers = ${JSON.stringify(otherPlayers)};
global._food = ${JSON.stringify(food)};
global._previousOtherPlayersState = ${JSON.stringify(prevOtherPlayers)};
global._worldWidth = ${state.width};
global._worldHeight = ${state.height};

${code}

${botApi}
`;

  return preparedCode;
}
