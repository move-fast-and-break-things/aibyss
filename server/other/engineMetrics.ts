import promClient from "prom-client";

export const gameStepTimeMs = new promClient.Histogram({
  name: "game_step_time_ms",
  help: "Time all bots took to make a move and engine took to process them",
  buckets: [200, 250],
});

export const botCodeRunTimeMs = new promClient.Histogram({
  name: "bot_code_run_time_ms",
  help: "Time a bot took to make a move",
  buckets: [50, 75],
  labelNames: ["username"] as const,
});

export const gameStepCodeRunTimeMs = new promClient.Histogram({
  name: "game_step_code_run_time_ms",
  help: "Time all bots took to make a move",
  buckets: [50, 100, 150],
});

export const gameStepMoveBotTimeMs = new promClient.Summary({
  name: "game_step_move_bot_time_ms",
  help: "Time it took to move all bots",
});

export const gameStepCollisionCheckTimeMs = new promClient.Summary({
  name: "game_step_collision_check_time_ms",
  help: "Time it took to check for collisions",
});

export const gameStepFoodSpawnTimeMs = new promClient.Summary({
  name: "game_step_food_spawn_time_ms",
  help: "Time it took to spawn food",
});
