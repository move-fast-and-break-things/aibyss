import { WORLD } from "../plugins/engine";

export default defineEventHandler(async (event) => {
  const gameState = WORLD.getState();

  return gameState;
});
