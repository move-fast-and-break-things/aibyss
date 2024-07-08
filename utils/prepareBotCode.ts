import type { Bot } from "~/utils/botstore";
import type { WorldState } from "~/utils/world";

type PrepareBotCodeArgs = {
  bot: Bot;
  state: WorldState;
  botApi: string;
};

export default function prepareBotCode({ bot, state, botApi }: PrepareBotCodeArgs): string | undefined {
  const { code } = bot;

  const botObject = state.bots.get(bot.id);
  if (!botObject) {
    // TODO(yurij): handle this better
    console.error(`Bot with id ${bot.id} not found in the world`);
    return;
  }

  const me = { x: botObject.x, y: botObject.y, radius: botObject.radius };
  const otherPlayers = [...state.bots.values()]
    .filter(b => b.id !== bot.id)
    .map(b => ({ x: b.x, y: b.y, radius: b.radius }));
  const food = state.food.map(f => ({ x: f.x, y: f.y, radius: f.radius }));

  const preparedCode = `
global._player = ${JSON.stringify(me)};
global._otherPlayers = ${JSON.stringify(otherPlayers)};
global._food = ${JSON.stringify(food)};
global._worldWidth = ${state.width};
global._worldHeight = ${state.height};

${code}

${botApi}
`;

  return preparedCode;
}
