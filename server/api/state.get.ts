import { WORLD_REF, BOT_ERRORS } from "../plugins/engine";
import * as botCodeStore from "~/other/botCodeStore";

export default defineEventHandler(async (event) => {
  const gameState = WORLD_REF.world.getState();
  const botCodes = botCodeStore.getBots();
  
  // Get the current user ID from the session
  const session = await useSession(event);
  const userId = session.data.user?.id;
  
  // Get error for the current user if it exists
  const errorStack = userId ? BOT_ERRORS[userId] : undefined;

  return {
    errorStack,
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
