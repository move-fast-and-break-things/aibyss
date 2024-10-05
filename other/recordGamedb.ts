import prisma from "~/other/db";

export type GameStat = {
  userId: number;
  size: number;
  foodEaten: number;
  kills: number;
  deaths: number;
};

type RecordGameArgs = {
  startTime: Date;
  endTime: Date;
  endReason: string;
  stats: GameStat[];
};

export async function recordGameEnd({ startTime, endTime, endReason, stats }: RecordGameArgs) {
  try {
    // Создание записи о завершении игры
    const game = await prisma.game.create({
      data: {
        start_time: startTime,
        end_time: endTime,
        end_reason: endReason,
        game_stats: {
          create: stats.map(stat => ({
            user_id: stat.userId,
            size: stat.size,
            food_eaten: stat.foodEaten,
            kills: stat.kills,
            deaths: stat.deaths,
          })),
        },
      },
      include: {
        game_stats: true,
      },
    });

    console.log("Game record added:", game);
  } catch (error) {
    console.error("Error recording game end:", error);
  }
}
