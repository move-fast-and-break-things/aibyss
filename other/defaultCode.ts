export const jsdoc = `/**
 * The game API available to your bot.
 *
 * @typedef {object} API
 * @property {Player} me
 *   Information about your player.
 * @property {Player[]} otherPlayers
 *   Information about other players.
 * @property {Food[]} food
 *   Information about the not yet eaten food.
 * @property {MoveTowards} moveTowards
 *   A method to move your player towards another
 *   player or food.
 * @property {MoveTo} moveTo
 *   A method to move your player to a specific position
 *   defined via \`{ x: number, y: number }\` object.
 * @property {number} worldHeight
 *   The height of the game world.
 * @property {number} worldWidth
 *   The width of the game world.
 */

/**
 * The player object.
 * 
 * @typedef {object} Player
 * @property {number} x
 * @property {number} y
 * @property {number} radius
 * @property {string} username
 */

/**
 * The food object.
 * 
 * @typedef {object} Food
 * @property {number} x
 * @property {number} y
 * @property {number} radius
 */

/**
 * The moveTowards function accepts a player or food object
 * and moves your player towards it.
 * 
 * @callback MoveTowards
 * @param {Player | Food} player
 */

/**
 * @typedef {object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * The moveTo function accepts a position object
 * and moves your player to that position.
 * 
 * @callback MoveTo
 * @param {Position} position
 */
`;

export const defaultCode = `/**
 * Implement the bot brain 🤖🧠 in the function "step"
 * This function will be called once per frame,
 * multiple times per second ⏱️, and will decide what
 * the bot does next!
 * Check out the API reference for the information about
 * what you can do ⬆️
 *
 * @param {API} api
 */
function step(api) {
  const target = api.otherPlayers[0];
  if (target && Math.random() > 0.3) {
    api.moveTowards(target);
  } else {
    api.moveTo({
      x: Math.random() > 0.5
        ? Math.max(api.me.x - 10, 0)
        : Math.min(api.me.x + 10, api.worldWidth),
      y: Math.random() > 0.5
        ? Math.max(api.me.y - 10, 0)
        : Math.min(api.me.y + 10, api.worldHeight),
    });
  }
}
`;
