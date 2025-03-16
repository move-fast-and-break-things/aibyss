import { WORLD_REF, BOT_ERRORS } from "../plugins/engine";
import * as botCodeStore from "~/other/botCodeStore";

export default defineEventHandler(async (event) => {
  const gameState = WORLD_REF.world.getState();
  const botCodes = botCodeStore.getBots();
  
  // Get the current user to find their error (if any)
  const user = event.context.user;
  const errorStack = user?.username && BOT_ERRORS[user.username] || undefined;

  return {
    ...gameState,
    errorStack,
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
