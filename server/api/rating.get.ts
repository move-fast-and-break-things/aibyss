import { type GameStats } from "@prisma/client";
import prisma from "~/other/db";

type UserStats = {
  gamesPlayed: number;
  wins: number;
  kills: number;
  deaths: number;
  foodEaten: number;
  maxEndgameSize: number;
  avgEndgameSize: number;
};

type UserRating = UserStats & {
  userId: number;
  username: string;
  score7days: number;
  score24hours: number;
  score1hour: number;
};

type RawStats = Omit<UserStats, "avgEndgameSize" | "maxEndgameSize"> & {
  endgameSizes: number[];
};

type RawUserStats = {
  userId: number;
  username: string;
  stats7days: RawStats;
  stats24hours: RawStats;
  stats1hour: RawStats;
};

export default defineEventHandler(async () => {
  const now = new Date();

  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // don't join users to not slow down the games query with another join
  const users = await prisma.user.findMany();
  const games = await prisma.game.findMany({
    where: { start_time: { gte: oneWeekAgo } },
    include: { game_stats: true },
  });

  const date24hoursAgo = new Date();
  date24hoursAgo.setHours(date24hoursAgo.getHours() - 24);

  const date1hourAgo = new Date();
  date1hourAgo.setHours(date1hourAgo.getHours() - 1);

  const rawUserStats: Record<number, RawUserStats> = {};

  for (const game of games) {
    const usersBySize = [...game.game_stats].sort((a, b) => b.size - a.size);
    // the winner is the largest user by the end of the game
    // but they shouldn't share the win with other users, otherwise it's a draw
    const winnerUserId = usersBySize[0]?.size !== usersBySize[1]?.size ? usersBySize[0]?.user_id : undefined;

    for (const stat of game.game_stats) {
      const user = users.find(user => user.id === stat.user_id);
      if (!user) {
        throw new Error(`User with id ${stat.user_id} not found`);
      }

      const rawUserStat = rawUserStats[stat.user_id] || (rawUserStats[stat.user_id] = {
        userId: stat.user_id,
        username: user.username,
        stats7days: getEmptyRawStats(),
        stats24hours: getEmptyRawStats(),
        stats1hour: getEmptyRawStats(),
      });

      rawUserStat.stats7days = bumpRawStats({
        rawStats: rawUserStat.stats7days,
        stats: stat,
        winnerUserId,
      });

      if (game.start_time > date24hoursAgo) {
        rawUserStat.stats24hours = bumpRawStats({
          rawStats: rawUserStat.stats24hours,
          stats: stat,
          winnerUserId,
        });
      }

      if (game.start_time > date1hourAgo) {
        rawUserStat.stats1hour = bumpRawStats({
          rawStats: rawUserStat.stats1hour,
          stats: stat,
          winnerUserId,
        });
      }
    }
  }

  const userRatings: UserRating[] = Object.values(rawUserStats).map((rawUserStat) => {
    return {
      ...rawUserStat.stats7days,
      userId: rawUserStat.userId,
      username: rawUserStat.username,
      maxEndgameSize: Math.max(...rawUserStat.stats7days.endgameSizes),
      avgEndgameSize: (
        rawUserStat.stats7days.endgameSizes.reduce((acc, size) => acc + size, 0)
        / rawUserStat.stats7days.endgameSizes.length
      ),
      score7days: computeScore(rawUserStat.stats7days),
      score24hours: computeScore(rawUserStat.stats24hours),
      score1hour: computeScore(rawUserStat.stats1hour),
    };
  }).sort((a, b) => b.score7days - a.score7days);

  return userRatings;
});

function computeScore(userRating: RawStats) {
  return (
    userRating.wins * 50
    + userRating.kills * 10
    + userRating.foodEaten
  );
}

function getEmptyRawStats(): RawStats {
  return {
    gamesPlayed: 0,
    wins: 0,
    kills: 0,
    deaths: 0,
    foodEaten: 0,
    endgameSizes: [],
  };
}

function bumpRawStats({ rawStats, stats, winnerUserId }: {
  rawStats: RawStats;
  stats: GameStats;
  winnerUserId: number | undefined;
}): RawStats {
  return {
    gamesPlayed: rawStats.gamesPlayed + 1,
    wins: rawStats.wins + (stats.user_id === winnerUserId ? 1 : 0),
    kills: rawStats.kills + stats.kills,
    deaths: rawStats.deaths + stats.deaths,
    foodEaten: rawStats.foodEaten + stats.food_eaten,
    endgameSizes: [...rawStats.endgameSizes, stats.size],
  };
}
