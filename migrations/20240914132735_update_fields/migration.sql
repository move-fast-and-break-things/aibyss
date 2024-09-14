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
    CONSTRAINT "GameStats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GameStats_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game" ("game_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GameStats" ("deaths", "food_eaten", "game_id", "id", "kills", "size", "user_id") SELECT "deaths", "food_eaten", "game_id", "id", "kills", "size", "user_id" FROM "GameStats";
DROP TABLE "GameStats";
ALTER TABLE "new_GameStats" RENAME TO "GameStats";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
