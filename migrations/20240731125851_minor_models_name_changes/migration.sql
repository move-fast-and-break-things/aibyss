/*
  Warnings:

  - You are about to drop the `Game_stats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Games` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Game_stats";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Games";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Game" (
    "game_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "end_reason" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GameStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "game_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "size" REAL NOT NULL,
    "num_eaten" INTEGER NOT NULL,
    "num_ate" INTEGER NOT NULL,
    CONSTRAINT "GameStats_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game" ("game_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
