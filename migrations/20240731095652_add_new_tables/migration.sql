-- CreateTable
CREATE TABLE "Games" (
    "game_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "end_reason" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Game_stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "game_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "size" REAL NOT NULL,
    "num_eaten" INTEGER NOT NULL,
    "num_ate" INTEGER NOT NULL,
    CONSTRAINT "Game_stats_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Games" ("game_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
