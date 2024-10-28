import type { BotCode } from "~/other/botCodeStore";
import type { WorldState } from "~/other/world";

type PrepareBotCodeArgs = {
  bot: BotCode;
  state: Pick<WorldState, "bots" | "food" | "width" | "height">;
  botApi: string;
};

export default function prepareBotCode({ bot, state, botApi }: PrepareBotCodeArgs): string | undefined {
  const { code } = bot;

  const botObject = [...state.bots.values()].find(b => bot.id === b.botId);
  if (!botObject) {
    // TODO(yurij): handle this better
    console.error(`Bot with id ${bot.id} not found in the world`);
    return;
  }

  const me = { x: botObject.x, y: botObject.y, radius: botObject.radius, username: botObject.username };
  const otherPlayers = [...state.bots.values()]
    .filter(b => b.botId !== bot.id)
    .map(b => ({ x: b.x, y: b.y, radius: b.radius, username: b.username }));
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
