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
  submissionCount: number;
};

export type UserRating = UserStats & {
  userId: number;
  username: string;
  score7days: number;
  score24hours: number;
  score1hour: number;
  /**
   * Contains the last 7 days of `score1hour` values.
   */
  scoreDynamic1hour: number[];
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
  scoreDynamic1hour: { intervalEnd: Date; stats: RawStats }[];
};

const ONE_HOUR_MS = 60 * 60 * 1000;

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

  const date24hoursAgo = new Date(now);
  date24hoursAgo.setHours(date24hoursAgo.getHours() - 24);

  const date1hourAgo = new Date(now);
  date1hourAgo.setHours(date1hourAgo.getHours() - 1);

  const rawUserStats: Record<number, RawUserStats> = {};

  const sortedGames = [...games].sort((a, b) => b.start_time.getTime() - a.start_time.getTime());
  for (const game of sortedGames) {
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
        submissionCount: user.submissionCount,
        stats7days: getEmptyRawStats(),
        stats24hours: getEmptyRawStats(),
        stats1hour: getEmptyRawStats(),
        scoreDynamic1hour: [{ intervalEnd: now, stats: getEmptyRawStats() }],
      });

      rawUserStat.stats7days = getUpdatedRawStats({
        rawStats: rawUserStat.stats7days,
        stats: stat,
        winnerUserId,
      });

      if (game.start_time > date24hoursAgo) {
        rawUserStat.stats24hours = getUpdatedRawStats({
          rawStats: rawUserStat.stats24hours,
          stats: stat,
          winnerUserId,
        });
      }

      if (game.start_time > date1hourAgo) {
        rawUserStat.stats1hour = getUpdatedRawStats({
          rawStats: rawUserStat.stats1hour,
          stats: stat,
          winnerUserId,
        });
      }

      const lastDynamicStat = rawUserStat.scoreDynamic1hour[rawUserStat.scoreDynamic1hour.length - 1];
      if (!lastDynamicStat) {
        throw new Error("lastDynamicStat is undefined");
      }
      if (lastDynamicStat.intervalEnd.getTime() - game.end_time.getTime() < ONE_HOUR_MS) {
        lastDynamicStat.stats = getUpdatedRawStats({
          rawStats: lastDynamicStat.stats,
          stats: stat,
          winnerUserId,
        });
      } else {
        // create new dynamic stats for earlier hours until we reach an hour
        // that covers the current game
        let matchingStat = lastDynamicStat;
        do {
          matchingStat = {
            intervalEnd: new Date(matchingStat.intervalEnd.getTime() - ONE_HOUR_MS),
            stats: getEmptyRawStats(),
          };
          rawUserStat.scoreDynamic1hour.push(matchingStat);
        } while (matchingStat.intervalEnd.getTime() - game.end_time.getTime() >= ONE_HOUR_MS);

        matchingStat.stats = getUpdatedRawStats({
          rawStats: matchingStat.stats,
          stats: stat,
          winnerUserId,
        });
      }
    }
  }

  const expectedDynamicStatCount = Math.ceil((now.getTime() - oneWeekAgo.getTime()) / ONE_HOUR_MS);

  const userRatings: UserRating[] = Object.values(rawUserStats).map((rawUserStat) => {
    const dynamicScores = rawUserStat.scoreDynamic1hour
      .map(dynamicStat => computeScore(dynamicStat.stats))
      .reverse();

    // pad the array with zeros to ensure they are all the same length
    // and we can graph them easily
    const scoreDynamic1hour = frontPadArrayWithZeros({
      array: dynamicScores,
      targetLength: expectedDynamicStatCount,
    });

    return {
      ...rawUserStat.stats7days,
      userId: rawUserStat.userId,
      username: rawUserStat.username,
      submissionCount: rawUserStat.submissionCount,
      maxEndgameSize: Math.max(...rawUserStat.stats7days.endgameSizes),
      avgEndgameSize: (
        rawUserStat.stats7days.endgameSizes.reduce((acc, size) => acc + size, 0)
        / rawUserStat.stats7days.endgameSizes.length
      ),
      score7days: computeScore(rawUserStat.stats7days),
      score24hours: computeScore(rawUserStat.stats24hours),
      score1hour: computeScore(rawUserStat.stats1hour),
      scoreDynamic1hour,
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

function getUpdatedRawStats({ rawStats, stats, winnerUserId }: {
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

function frontPadArrayWithZeros({ array, targetLength }: {
  array: number[];
  targetLength: number;
}) {
  if (array.length > targetLength) {
    throw new Error("array.length > targetLength");
  }
  return [...new Array(targetLength - array.length).fill(0), ...array];
}
