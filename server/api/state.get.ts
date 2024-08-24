import { WORLD } from "../plugins/engine";
import * as botStore from "~/utils/botstore";

export default defineEventHandler(async () => {
  const gameState = WORLD.getState();

  const botCodes = botStore.getBots();

  return {
    ...gameState,
    bots: Object.fromEntries([...gameState.bots.entries()].map(([id, bot]) => {
      const botCode = botCodes[bot.botId];
      if (!botCode) {
        throw new Error(`Bot with id ${bot.botId} not found`);
      }

      const botWithUsername = {
        ...bot,
        username: botCode.username,
      };

      return [id, botWithUsername];
    })),
  };
});
