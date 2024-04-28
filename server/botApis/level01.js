global._actions = [];

function getBotApiV1() {
  const moveTo = ({ x, y }) => {
    global._actions.push({ type: "move", x, y });
  };

  return {
    me: global._player,
    otherPlayers: global._otherPlayers || [],
    food: global._food || [],
    moveTowards: moveTo,
    moveTo,
  };
}

function doStep() {
  const botApi = getBotApiV1();
  // eslint-disable-next-line no-undef -- defined by our script loading the API
  step(botApi);
  return JSON.stringify(global._actions);
}

doStep();
