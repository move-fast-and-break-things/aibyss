import type { Game, GameStats, User } from "@prisma/client";
import prisma from "~/other/db";

type GameWithStatsAndUser = Game & {
  game_stats: (GameStats & {
    user: User;
  })[];
};

export default defineEventHandler(async (event): Promise<GameWithStatsAndUser[] | { error: string }> => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  try {
    const games = await prisma.game.findMany({
      where: {
        start_time: {
          gte: oneWeekAgo,
        },
      },
      include: {
        game_stats: {
          include: {
            user: true,
          },
        },
      },
    });

    games.forEach((game) => {
      game.game_stats.sort((a, b) => b.kills - a.kills);
    });

    const formattedGames: GameWithStatsAndUser[] = games.map(game => ({
      ...game,
      start_time: new Date(game.start_time),
      end_time: new Date(game.end_time),
    }));

    return formattedGames;
  } catch (error) {
    console.error("Ошибка при получении игр:", error);
    setResponseStatus(event, 500);
    return { error: "Не удалось получить игры" };
  }
});
