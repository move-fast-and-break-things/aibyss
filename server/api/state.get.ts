import { WORLD } from "../plugins/engine";

export default defineEventHandler(async () => {
  const gameState = WORLD.getState();

  return { ...gameState, bots: Object.fromEntries(gameState.bots.entries()) };
});
