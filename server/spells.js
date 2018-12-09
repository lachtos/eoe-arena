// spells module

// spectral (teleport, adds debuffs, removes buffs)
// bane (damage)
// guardian (buffs)
// spirit (heal, remove debuffs)

module.exports = {
  close_range: ['hand_of_pain', 'ice_kiss', 'clawkill', 'drainhand', 'lethal_claw'],
  long_range: ['zap', 'double_zap', 'big_zap', 'sticky_fire', 'inferno', 'lightning', 'fireball'],
  debuff: ['lower_will', 'plague'],
};

// bane
module.exports.zap = function (ga) {
  var damage = ga.calculateSpellDamage(); // calculate real damage depending on the skill, mastery, weapon, etc.
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": ZAP (" + damage + " damage)");
};

module.exports.double_zap = function (ga) {
  var damage = ga.calculateSpellDamage(); // calculate real damage depending on the skill, mastery, weapon, etc.
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'double-hit';
  ga.clientData.data.damage = damage;
  ga.time = 2500;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": DOUBLE ZAP (" + damage + " damage)");
};

module.exports.hand_of_pain = function (ga) {
  var damage = ga.calculateSpellDamage(); // calculate real damage depending on the skill, mastery, weapon, etc.
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": HAND OF PAIN (" + damage + " damage)");
};

module.exports.big_zap = function (ga) {
  var damage = ga.calculateSpellDamage(); // calculate real damage depending on the skill, mastery, weapon, etc.
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": BIG ZAP (" + damage + " damage)");
};

module.exports.ice_kiss = function (ga) {
  var damage = ga.calculateSpellDamage(); // calculate real damage depending on the skill, mastery, weapon, etc.
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": ICE KISS (" + damage + " damage)");
};

module.exports.sticky_fire = function (ga) {
  var damage = ga.calculateSpellDamage(); // calculate real damage depending on the skill, mastery, weapon, etc.
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  ga.clientData.data.sprite = 1;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": STICKY FIRE (" + damage + " damage)");
};

module.exports.clawkill = function (ga) {
  var damage = ga.calculateSpellDamage(); // calculate real damage depending on the skill, mastery, weapon, etc.
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": CLAWKILL (" + damage + " damage)");
};

module.exports.inferno = function (ga) {
  var damage = ga.calculateSpellDamage(); // calculate real damage depending on the skill, mastery, weapon, etc.
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  ga.clientData.data.sprite = 1;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": INFERNO (" + damage + " damage)");
};

module.exports.drainhand = function (ga) {
  var damage = ga.calculateSpellDamage(); // calculate real damage depending on the skill, mastery, weapon, etc.
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": DRAINHAND (" + damage + " damage)");
};

module.exports.lightning = function (ga) {
  var damage = ga.calculateSpellDamage(); // calculate real damage depending on the skill, mastery, weapon, etc.
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": LIGHTNING (" + damage + " damage)");
};

module.exports.fireball = function (ga) {
  var damage = ga.calculateSpellDamage(); // calculate real damage depending on the skill, mastery, weapon, etc.
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  ga.clientData.data.sprite = 1;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": FIREBALL (" + damage + " damage)");
};

module.exports.lethal_claw = function (ga) {
  var damage = ga.calculateSpellDamage(); // calculate real damage depending on the skill, mastery, weapon, etc.
  ga.enemy.gameState.hp -= damage;
  ga.clientData.data.status = 'hit';
  ga.clientData.data.damage = damage;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": LETHAL CLAW (" + damage + " damage)");
};

// spectral
module.exports.blink = function (ga) {
  var newPos = ga.game.arena.getRandomEmptyTile().pos;
  ga.player.moveToPosition(newPos);
  ga.clientData.data.status = 'teleport';
  ga.clientData.data.pos = newPos;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": BLINK (" + newPos.x + ", " + newPos.y + ")");
};

module.exports.shift = function (ga) {
  var newPos = ga.game.arena.getRandomEmptyTile().pos;
  ga.player.moveToPosition(newPos);
  ga.clientData.data.status = 'teleport';
  ga.clientData.data.pos = newPos;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": SHIFT (" + newPos.x + ", " + newPos.y + ")");
};

module.exports.ghost_walk = function (ga) {
  var newPos = ga.data;
  var targetTile = ga.game.arena.getTileByPos(newPos);
  if (ga.game.isTileOccupied(targetTile)) {
    ga.clientData.data.status = 'teleport-fail';
  } else {
    ga.player.moveToPosition(newPos);
    ga.clientData.data.status = 'teleport';
    ga.clientData.data.pos = newPos;
    console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": GHOST WALK (" + newPos.x + ", " + newPos.y + ")");
  }
};

module.exports.wraith_walk = function (ga) {
  var newPos = ga.data;
  var targetTile = ga.game.arena.getTileByPos(newPos);
  if (ga.game.isTileOccupied(targetTile)) {
    ga.clientData.data.status = 'teleport-fail';
  } else {
    ga.player.moveToPosition(newPos);
    ga.clientData.data.status = 'teleport';
    ga.clientData.data.pos = newPos;
    console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": WRAITH WALK (" + newPos.x + ", " + newPos.y + ")");
  }
};

module.exports.lower_will = function (ga) {
  ga.clientData.data.status = 'debuff';
  ga.clientData.data.name = 'Lower Will';
  ga.enemy.gameState.buffs.addTurnPassive('lower-resist', ga.skill_info.value);
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": LOWER WILL");
};

// guardian
module.exports.magic_coat = function (ga) {
  ga.clientData.data.status = 'buff';
  ga.clientData.data.name = 'Magic Coat';
  ga.player.gameState.buffs.addTurnPassive('weapon-absorb', ga.skill_info.value);
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": MAGIC COAT");
};

module.exports.blur_body = function (ga) {
  ga.clientData.data.status = 'buff';
  ga.clientData.data.name = 'Blur Body';
  ga.player.gameState.buffs.addTurnPassive('evade-spell', ga.skill_info.value);
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": BLUR BODY");
};

module.exports.mind_block = function (ga) {
  ga.clientData.data.status = 'buff';
  ga.clientData.data.name = 'Mind Block';
  ga.player.gameState.buffs.addTurnPassive('resist', ga.skill_info.value);
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": MIND BLOCK");
};

// spirit
module.exports.minor_cure = function (ga) {
  var health = ga.skill_info.value;
  ga.player.gameState.hp += health;
  ga.clientData.data.status = 'restore';
  ga.clientData.data.health = health;
  console.log((Math.round(ga.timestamp * 100) / 100).toString().padStart(7) + " > " + ga.player.user.name.padStart(20) + ": MINOR CURE (" + health + " health)");
};
