if (typeof module === 'undefined') {
  var module = {};
}

module.exports = {
  timeBetweenTurns: 250,

  arePositionsAdjacent: function (t1, t2) { // N W S E
    return (t1.x == t2.x && t1.y != t2.y && Math.abs(t1.y - t2.y) == 1)
        || (t1.x != t2.x && t1.y == t2.y && Math.abs(t1.x - t2.x) == 1);
  },

  arePositionsTouching: function (t1, t2) { // N NW W SW S SE E NE
    return this.arePositionsAdjacent(t1, t2)
        || (Math.abs(t1.y - t2.y) == 1 && Math.abs(t1.x - t2.x) == 1);
  },

  getWeaponType: function (id) {
    for (var i in this.weaponTypes) {
      if (this.weaponTypes[i].indexOf(id) != -1) {
        return i;
      }
    }
    return "other";
  },

  getLvlInfo: function (xp) {
  	var cxp = 0, clvl = 0, pxp = 0;
  	while (cxp <= xp) {
  		pxp = cxp;
  		cxp += 100 + 20*clvl;
  		clvl++;
  	}
  	return {
      lvl: Math.max(0, clvl - 1),
      progress: Math.floor((xp - pxp) / (cxp - pxp) * 100),
    };
  },

  getStatPlusAmount: function (stat) {
    if      (stat < 42) return 3;
    else if (stat < 68) return 2;
    else                return 1;
  },

  weaponTypes: {
    'sword':     [1, 27, 28, 65, 66, 67, 85, 86, 87, 111],
    'axe':       [34, 25, 69, 70, 92, 93, 94, 108, 109, 113],
    'hammer':    [29, 30, 33, 68, 88, 89, 90, 91, 107, 112],
    'bow':       [2, 36, 37, 74, 75, 76, 78, 99, 100, 101, 102],
    'fire-bow':  [77],
    'bomb':      [4, 38, 79, 80, 103, 104, 105, 106],
    'fire-bomb': [81, 82, 83, 84],
    'armor':     [3, 5, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64],
    'trap':      [26, 39, 71, 72, 73, 95, 96, 97, 98, 110, 114],
  },

  skillLimit: {
    movement: 3,
    melee: 4,
    range: 4,
    defense: 3,
    magic: 5,
    magic2: 6
  }
};
