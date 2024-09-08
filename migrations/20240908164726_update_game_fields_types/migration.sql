/*
  Warnings:

  - You are about to alter the column `end_time` on the `Game` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `start_time` on the `Game` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "game_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "end_reason" TEXT NOT NULL
);
INSERT INTO "new_Game" ("end_reason", "end_time", "game_id", "start_time") SELECT "end_reason", "end_time", "game_id", "start_time" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
