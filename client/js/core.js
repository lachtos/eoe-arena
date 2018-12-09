var CLIENT = {
  FPS: 30,
  socket: null,
  ctx: null,
  ingame: false,
  game: null,
  pointerPos: { x: null, y: null },
  moveTiles: [],
  lastTile: { x: null, y: null },
  animatedProperties: {
    hp: 0,
    energy: 0,
  },
  action_bar_types: {},
  dialog: null,
  online: [],
  challenges: [], // delete
  sent_challenges: {},
  received_challenges: {},
};
