import prisma from "~/other/db";

type UserRating = {
  userId: number;
  username: string;
  score: number;
  gamesPlayed: number;
  wins: number;
  kills: number;
  deaths: number;
  foodEaten: number;
  maxEndgameSize: number;
  avgEndgameSize: number;
};

type RawUserRating = Omit<UserRating, "avgEndgameSize" | "maxEndgameSize"> & {
  endgameSizes: number[];
};

export default defineEventHandler(async () => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // don't join users to not slow down the games query with another join
  const users = await prisma.user.findMany();

  const games = await prisma.game.findMany({
    where: {
      start_time: {
        gte: oneWeekAgo,
      },
    },
    include: {
      game_stats: true,
    },
  });

  const rawUserRatings: Record<number, RawUserRating> = {};

  for (const game of games) {
    for (const stat of game.game_stats) {
      const userRating = rawUserRatings[stat.user_id] || (rawUserRatings[stat.user_id] = {
        userId: stat.user_id,
        username: users.find(user => user.id === stat.user_id)?.username ?? "Mysterious Stranger",
        score: 0,
        gamesPlayed: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        foodEaten: 0,
        endgameSizes: [],
      });

      userRating.gamesPlayed += 1;
      userRating.kills += stat.kills;
      userRating.deaths += stat.deaths;
      userRating.foodEaten += stat.food_eaten;
      userRating.endgameSizes.push(stat.size);
      userRating.wins += Number(game.game_stats.every(s => s.user_id === stat.user_id || s.size < stat.size));
    }
  }

  const userRatings: UserRating[] = Object.values(rawUserRatings).map((userRating) => {
    const finalRating = {
      ...userRating,
      maxEndgameSize: Math.max(...userRating.endgameSizes),
      avgEndgameSize: userRating.endgameSizes.reduce((acc, size) => acc + size, 0) / userRating.endgameSizes.length,
    };

    finalRating.score = computeScore(finalRating);

    return finalRating;
  }).sort((a, b) => b.score - a.score);

  return userRatings;
});

function computeScore(userRating: UserRating) {
  return (
    userRating.wins * 50
    + userRating.kills * 10
    + userRating.foodEaten
  );
}
