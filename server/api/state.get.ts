import { WORLD_REF, botErrors } from "../plugins/engine";
import * as botCodeStore from "~/other/botCodeStore";

export default defineEventHandler(async () => {
  const gameState = WORLD_REF.world.getState();

  const botCodes = botCodeStore.getBots();
  
  // Transform bot errors to be keyed by username
  const errorStackMap: Record<string, string> = {};
  for (const [botId, error] of Object.entries(botErrors)) {
    const botCode = botCodes[botId];
    if (botCode) {
      errorStackMap[botCode.username] = error;
    }
  }

  return {
    errorStack: errorStackMap,
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
