import type { BotCode } from "~/other/botCodeStore";
import type { WorldState } from "~/other/world";

type PrepareBotCodeArgs = {
  bot: BotCode;
  botInfo: Record<string, { username: string }>;
  state: Pick<WorldState, "bots" | "food" | "width" | "height">;
  prevState: Pick<WorldState, "bots" | "food">;
  botApi: string;
};

export default function prepareBotCode({ bot, botInfo, state, prevState, botApi }: PrepareBotCodeArgs): string {
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

  const prevBotObject = [...prevState.bots.values()].find(b => bot.id === b.botId);
  // if bot was not in the previous state, this means we've just spawned
  // and we should use the current state as the previous state
  const prevMe = prevBotObject
    ? {
        x: prevBotObject.x,
        y: prevBotObject.y,
        radius: prevBotObject.radius,
      }
    : me;
  const prevOtherPlayers = [...prevState.bots.values()]
    .filter(b => b.botId !== bot.id)
    .map(b => ({ x: b.x, y: b.y, radius: b.radius, username: botInfo[b.botId]?.username }));
  const prevFood = prevState.food.map(f => ({ x: f.x, y: f.y, radius: f.radius }));

  const preparedCode = `
global._player = ${JSON.stringify(me)};
global._otherPlayers = ${JSON.stringify(otherPlayers)};
global._food = ${JSON.stringify(food)};
global._previousState = ${JSON.stringify({ me: prevMe, otherPlayers: prevOtherPlayers, food: prevFood })};
global._worldWidth = ${state.width};
global._worldHeight = ${state.height};

${code}

${botApi}
`;

  return preparedCode;
}
