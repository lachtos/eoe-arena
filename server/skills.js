// skills module

// movement
// close combat
// long range
// bomb toss
// trap placement

module.exports = {

};

// movement
module.exports.move = function (ga) {
  var newPos = ga.data;
  var targetTile = ga.game.arena.getTileByPos(newPos);
  if (!ga.game.SHARED.arePositionsAdjacent(ga.player.gameState.tile.pos, ga.data) || ga.game.isTileOccupied(targetTile)) {
    // tiles are not adjacent or the target tile is already occupied
    ga.clientData.data.status = 'fail';
    return;
  }

  if (ga.player.gameState.buffs.getActiveBuff('confusion', ga.timestamp)) {
    // player is confused so he moves in random directions
    newPos = ga.game.arena.getRandomAdjacentTile().pos;
    ga.clientData.data.status = 'confused';
  } else {
    ga.clientData.data.status = 'success';
  }

  ga.player.moveToPosition(newPos, true);
  ga.clientData.data.pos = newPos;

  // TODO: remove trap on the tile

  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": MOVE (" + newPos.x + ", " + newPos.y + ")");
};

module.exports.wait = function (ga) {
  ga.time = 0;
  ga.include = false;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": WAIT");
};

module.exports.panic = function (ga) {
  newPos = ga.game.arena.getRandomAdjacentTile(ga.player.gameState.tile.pos).pos
  ga.player.moveToPosition(newPos);
  ga.clientData.data.status = 'success';
  ga.clientData.data.pos = newPos;

  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": PANIC (" + newPos.x + ", " + newPos.y + ")");
};

module.exports.tiptoe = function (ga) {
  var newPos = ga.data;
  var targetTile = ga.game.arena.getTileByPos(newPos);
  if (!ga.game.SHARED.arePositionsAdjacent(ga.player.gameState.tile.pos, ga.data) || ga.game.isTileOccupied(targetTile)) {
    // tiles are not adjacent or the target tile is already occupied
    ga.clientData.data.status = 'fail';
    return;
  }

  if (ga.player.gameState.buffs.getActiveBuff('confusion', ga.timestamp)) {
    // player is confused so he moves in random directions
    newPos = ga.game.arena.getRandomAdjacentTile().pos;
    ga.clientData.data.status = 'confused';
  } else {
    ga.clientData.data.status = 'success';
  }

  ga.player.moveToPosition(newPos, true);
  ga.clientData.data.pos = newPos;

  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": TIPTOE (" + newPos.x + ", " + newPos.y + ")");
};

module.exports.disarm_trap = function (ga) {
  var newPos = ga.data;
  var targetTile = ga.game.arena.getTileByPos(newPos);
  if (!ga.game.SHARED.arePositionsAdjacent(ga.player.gameState.tile.pos, ga.data) || ga.game.isTileOccupied(targetTile)) {
    // tiles are not adjacent or the target tile is already occupied
    ga.clientData.data.status = 'fail';
    return;
  }

  if (ga.player.gameState.buffs.getActiveBuff('confusion', ga.timestamp)) {
    // player is confused so he moves in random directions
    newPos = ga.game.arena.getRandomAdjacentTile().pos;
    ga.clientData.data.status = 'confused';
  } else {
    ga.clientData.data.status = 'success';
  }

  ga.player.moveToPosition(newPos, true);
  ga.clientData.data.pos = newPos;

  // TODO: remove trap on the tile

  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": DISARM TRAP (" + newPos.x + ", " + newPos.y + ")");
};

// close combat
module.exports.hit = function (ga) {
  var damage = ga.calculateWeaponDamage();
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": HIT (" + damage + ")");
};

module.exports.aimed_hit = function (ga) {
  var damage = ga.calculateWeaponDamage();
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": AIMED HIT (" + damage + ")");
};

module.exports.whip_hit = function (ga) {
  var damage = ga.calculateWeaponDamage();
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": WHIP HIT (" + damage + ")");
};

module.exports.place_trap = function (ga) {
  ga.time = 0;
  ga.include = false;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": PLACE TRAP (" + damage + ")");
};

module.exports.nerve_hit = function (ga) {
  var damage = ga.calculateWeaponDamage();
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": NERVE HIT (" + damage + ")");
};

module.exports.power_hit = function (ga) {
  var damage = ga.calculateWeaponDamage();
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": POWER HIT (" + damage + ")");
};


// ranged
module.exports.shoot = function (ga) {
  var damage = ga.calculateWeaponDamage();
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": SHOOT (" + damage + ")");
};

module.exports.snapshot = function (ga) {
  var damage = ga.calculateWeaponDamage();
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": SNAPSHOT (" + damage + ")");
};

module.exports.toss_bomb = function (ga) {
  var damage = ga.calculateWeaponDamage();
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.type = 'bomb';
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": TOSS BOMB (" + damage + ")");
};

module.exports.snipe = function (ga) {
  var damage = ga.calculateWeaponDamage();
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": SNIPE (" + damage + ")");
};

module.exports.double_shot = function (ga) {
  var damage = ga.calculateWeaponDamage();
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'double-hit';
  ga.clientData.data.damage = damage;
  ga.time = 2500;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": DOUBLE SHOT (" + damage + ")");
};

// defend
module.exports.dodge = function (ga) {
  var dx = ga.game.SERVER.dxMultiplier(ga.player.user.character.stats.dx - ga.skill_info.req[2]);
  var evadeChance = ga.skill_info.precision * dx;
  ga.player.gameState.buffs.addTimedPassive('evade', evadeChance, ga.timestamp + 50);
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": DODGE");
};

module.exports.deflect = function (ga) {
  var dx = ga.game.SERVER.dxMultiplier(ga.player.user.character.stats.dx - ga.skill_info.req[2]);
  var evadeChance = ga.skill_info.precision * dx;
  ga.player.gameState.buffs.addTimedPassive('evade', evadeChance, ga.timestamp + 50);
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": DEFLECT");
};

module.exports.evade = function (ga) {
  var dx = ga.game.SERVER.dxMultiplier(ga.player.user.character.stats.dx - ga.skill_info.req[2]);
  var evadeChance = ga.skill_info.precision * dx;
  ga.player.gameState.buffs.addTimedPassive('evade', evadeChance, ga.timestamp + 50);
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": EVADE");
};

module.exports.slide = function (ga) {
  var dx = ga.game.SERVER.dxMultiplier(ga.player.user.character.stats.dx - ga.skill_info.req[2]);
  var evadeChance = ga.skill_info.precision * dx;
  ga.player.gameState.buffs.addTimedPassive('evade', evadeChance, ga.timestamp + 50);
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": SLIDE");
};

module.exports.parry = function (ga) {
  var dx = ga.game.SERVER.dxMultiplier(ga.player.user.character.stats.dx - ga.skill_info.req[2]);
  var evadeChance = ga.skill_info.precision * dx;
  ga.player.gameState.buffs.addTimedPassive('evade', evadeChance, ga.timestamp + 50);
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": PARRY");
};
