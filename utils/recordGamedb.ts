import prisma from "~/utils/db";

type GameStat = {
  player_id: string;
  size: number;
  food_eaten: number;
  kills: number;
  deaths: number;
};

type recordGameArgs = {
  startTime: string;
  endTime: string;
  endReason: string;
  stats: GameStat[];
};

export async function recordGameEnd({ startTime, endTime, endReason, stats }: recordGameArgs) {
  try {
    // Создание записи о завершении игры
    const game = await prisma.game.create({
      data: {
        start_time: startTime,
        end_time: endTime,
        end_reason: endReason,
        game_stats: {
          create: stats.map(stat => ({
            player_id: stat.player_id,
            size: stat.size,
            food_eaten: stat.food_eaten,
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
  } finally {
    await prisma.$disconnect();
  }
}
