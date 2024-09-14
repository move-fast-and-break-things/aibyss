/*
  Warnings:

  - You are about to drop the column `num_ate` on the `GameStats` table. All the data in the column will be lost.
  - You are about to drop the column `num_eaten` on the `GameStats` table. All the data in the column will be lost.
  - You are about to drop the column `player_id` on the `GameStats` table. All the data in the column will be lost.
  - Added the required column `deaths` to the `GameStats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `food_eaten` to the `GameStats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kills` to the `GameStats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `GameStats` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "game_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "size" REAL NOT NULL,
    "food_eaten" INTEGER NOT NULL,
    "kills" INTEGER NOT NULL,
    "deaths" INTEGER NOT NULL,
    CONSTRAINT "GameStats_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game" ("game_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GameStats" ("game_id", "id", "size") SELECT "game_id", "id", "size" FROM "GameStats";
DROP TABLE "GameStats";
ALTER TABLE "new_GameStats" RENAME TO "GameStats";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
