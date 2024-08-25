import { WORLD_REF } from "../plugins/engine";
import * as botCodeStore from "~/utils/botCodeStore";

export default defineEventHandler(async () => {
  const gameState = WORLD_REF.world.getState();

  const botCodes = botCodeStore.getBots();

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
