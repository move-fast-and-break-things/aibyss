import prisma from "~/other/db";

export default defineEventHandler(async () => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

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

  const formattedGames = games.map(game => ({
    ...game,
    start_time: new Date(game.start_time),
    end_time: new Date(game.end_time),
  }));

  return formattedGames;
});
