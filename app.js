var SHARED = {};

var SERVER = {
  io: null,
  db: null,
  Sockets: {},
  Sessions: {},
  Players: {},
  Challenges: {},
  Games: {},
  counter: 0,
  lastOnlineList: [],
  turnTime: 15, // seconds
};

SERVER.User = function (data) {
  this.name = data.username,
  this.id = data.id;
  this.socket = data.socket;
  this.char_id = data.char_id;
  this.character = {};
  this.player = new SERVER.Player(this);
  var scope = this;
  this.getCharacter().then((ret) => {
    scope.character = ret;
  });
};

SERVER.User.prototype.getCharacter = function () {
  var scope = this;
  return new Promise((resolve, reject) => {
    SERVER.db.characters.findOne({ _id: scope.char_id }, function (err, res) {
      if (res) {
        var character = {
          name: scope.name,
          stats: {
            to: res.to,
            st: res.st,
            dx: res.dx,
            in: res.in,
            wi: res.wi,
            sp: res.sp
          },
          xp: res.xp,
          respect: res.respect,
          kg: res.kg,
          points: res.pts,
          xplock: res.xplock || 0,
          weapon: res.weapon,
          bow: res.bow,
          armor: res.armor,
          bomb: res.bomb,
          trap: res.trap,
          movement: res.movement || [],
          defense: res.defense || [],
          melee: res.melee || [],
          range: res.range || [],
          magic: res.magic || [],
          magic2: res.magic2 || [],
          taunts: res.taunts || [],
          id: scope.char_id,
        };
        resolve(character);
      } else {
        reject("Can't find character by ID.");
      }
    });
  });
};

SERVER.User.prototype.getObject = function () {
  var scope = this;
  var obj = {
    id: this.id,
  };
  return new Promise((resolve, reject) => {
    scope.getCharacter().then((char) => {
      obj.character = char;
      resolve(obj);
    });
  });
};

SERVER.User.prototype.getXP = function () {
  return 150;
};

SERVER.init = function () {
  // Express init
  var express = require('express');
  var app = express();
  var serv = require('http').Server(app);

  app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
  });
  app.get('/shared/utils.js', function (req, res) {
    res.sendFile(__dirname + '/shared/utils.js');
  });
  app.get('/ajax', function (req, res) {
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      if (Object.keys(req.query).length > 0) {
        console.log("GET request with params: " + JSON.stringify(req.query));
        res.writeHead(200, {'Content-Type': 'application/json'});
        var token = req.headers['cookie'].split('token=').pop().split(';').shift();
        if (SERVER.Sessions.hasOwnProperty(token)) {
          var user = SERVER.Sessions[token];
          req.query._user = user;
        } else {
          res.end(JSON.stringify({ status: -1 }));
          return;
        }
        SERVER.getGETResponse(req.query).then((obj) => {
          res.end(JSON.stringify(obj));
        });
      }
    }
  });
  app.post('/ajax', function (req, res) {
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      var body = '';
      req.on('data', function (data) {
        body += data;
      });
      req.on('end', function () {
        if (body.length > 0) {
          var parsed = JSON.parse(body);
          res.writeHead(200, {'Content-Type': 'application/json'});
          if (parsed.ajax_action != "login" && parsed.ajax_action != "register" && parsed.ajax_action != "authenticate") {
            var token = req.headers['cookie'].split('token=').pop().split(';').shift();
            if (SERVER.Sessions.hasOwnProperty(token)) {
              var user = SERVER.Sessions[token];
              parsed._user = user;
            } else {
              res.end(JSON.stringify({ status: -1 }));
              return;
            }
          }
          SERVER.getPOSTResponse(parsed).then((obj) => {
            res.end(JSON.stringify(obj));
          });
        }
      });
    }
  });

  app.use('/client', express.static(__dirname + '/client'));
  serv.listen(process.env.PORT || 2000);

  // MongoDB init
  var mongo_user = process.env.MONGO_USER;
  var mongo_pass = process.env.MONGO_PASS;
  var mongo_url  = process.env.MONGO_URL;
	console.log(mongo_url);
  const uri = "mongodb+srv://" + mongo_user + ":" + mongo_pass + "@" + mongo_url + "/game?retryWrites=true&w=majority";
  this.db = require("mongojs")(uri, ['users', 'characters', 'skills', 'items', 'finished_battles']);
	
  // var connString = 'mongodb://' + mongo_user + ':' + mongo_pass + '@eoe-cluster-shard-00-00-tsy5s.mongodb.net:27017,eoe-cluster-shard-00-01-tsy5s.mongodb.net:27017,eoe-cluster-shard-00-02-tsy5s.mongodb.net:27017/game?ssl=true&replicaSet=EOE-Cluster-shard-0&authSource=admin&retryWrites=true';
  // this.db = require("mongojs")(connString, ['users', 'characters', 'skills', 'items', 'finished_battles']);
  // this.db = require("mongojs")('localhost:27017/game', ['users', 'characters', 'skills', 'items', 'finished_battles']);

  // Socket.io init
  this.io = require('socket.io')(serv, {});

  // encrytpion
  md5 = require('md5');
  crypto = require('crypto');

  // load shared utilities
  SHARED = require('./shared/utils.js');

  SPELLS = require('./server/spells.js');
  SKILLS = require('./server/skills.js');

  SERVER.db.skills.find({}, function (err, res) {
    SERVER.SKILL_INFO = res;
    SERVER.db.items.find({}, function (err2, res2) {
      SERVER.ITEM_INFO = res2;
      console.log("Server started.");
    });
  });

};

SERVER.onSocketConnection = function (socket) {
  SERVER.Sockets[socket.id] = socket;

  //var player = new SERVER.Player(socket.id);
  //SERVER.Players[socket.id] = player;

  var onevent = socket.onevent;
  socket.onevent = function (packet) {
    var args = packet.data || [];
    onevent.call (this, packet);    // original call
    packet.data = ["*"].concat(args);
    onevent.call(this, packet);      // additional call to catch-all
  };

  // check socket authentity
  socket.on("*", function (evt, data) {
    if (data.session_token && SERVER.Sessions.hasOwnProperty(data.session_token)) {
      SERVER.handleSocketMessage(socket, evt, data);
    } else {
      // user authentication failure, please re-auth
      socket.emit('auth-failure', {});
    }
  });

  socket.on('disconnect', function () {
    var token = SERVER.getTokenBySocket(socket);
    delete SERVER.Sockets[socket.id];
    if (token) SERVER.Sessions[token].dc_timestamp = + new Date();
  })

};

SERVER.handleSocketMessage = function (socket, evt, data) {
  var player = SERVER.getPlayerBySocket(socket);
  if (!player) return;

  switch (evt) {
    case 'challenge-player':
      if (player.game == null) {
        var challenge = new SERVER.Challenge(player.user.id, data.id);
      } else {
        socket.emit('alert', { content: "You are already in game or waiting for the game to start." });
      }
      break;
    case 'challenge-response':
      var ch = SERVER.Challenges[data.ch_id];
      if (typeof ch === 'undefined' || ch.receiver.user.id != player.user.id || ch.game) {
        socket.emit('alert', { content: "Sorry but this challenge does not exist anymore." });
      } else {
        if (data.response) {
          ch.accept();
        } else {
          ch.reject();
        }
      }
      break;
    case 'challenge-withdraw':
      var ch = SERVER.Challenges[data.ch_id];
      if (typeof ch === 'undefined' || ch.sender.user.id != player.user.id || ch.game) {
        socket.emit('alert', { content: "Sorry but this challenge does not exist anymore." });
      } else {
        ch.withdraw();
      }
      break;
    case 'turn-actions':
      var game = SERVER.getGameByPlayer(player);
      if (game) {
        game.comitActions(player, data.actions);
      }
      break;
    case 'request-online':
      player.user._needsOnlineUpdate = true;
      break;
    case 'debug':
      console.log("DEBUG: ", data);
      break;
  };
};

// Authentication
SERVER.getUser = function (data) {
  return new Promise((resolve, reject) => {
    if (!SERVER.Sessions.hasOwnProperty(data.token)) {
      // user with this token is not authenticated
      resolve({ status: 0 });
    } else {
      // user is authenticated, return user info
      var user = SERVER.Sessions[data.token];
      user.getObject().then((obj) => {
        var prevSocket = user.socket.id;
        user.socket = SERVER.Sockets[data.socket_id];
        delete SERVER.Sockets[prevSocket];
        delete user.dc_timestamp;
        resolve({ status: 1, user: obj });
      });
    }
  });
};

SERVER.createUser = function (data) {
  // do checks if user name exists etc
  return new Promise((resolve, reject) => {
    if (data.username.length > 16) {
      resolve({ status: 0, msg: "Username is too long. Max 16 characters." });
    } else {
      SERVER.db.users.findOne({ name: data.username }, function (err, res) {
        if (res) { // found something
          resolve({ status: 0, msg: "Username is taken by somebody else." });
        } else { // found nothing
          SERVER.db.characters.insert(JSON.parse(JSON.stringify(SERVER.level0char)), function (err2, res2) {
            if (res2) {
              SERVER.db.users.insert({ name: data.username, pass: data.password, char_id: res2._id }, function (err3, res3) {
                if (res3) {
                  resolve({ status: 1 });
                } else {
                  resolve({ status: 0, msg: "Cannot create an account with this username." });
                }
              });
            } else {
              resolve({ status: 0, msg: "Account creation failed." });
            }
          });
        }
      });
    }
  });
};

SERVER.loginUser = function (data) {
  return new Promise((resolve, reject) => {
    SERVER.db.users.findOne({ name: data.username, pass: data.password }, function (err, res) {
      if (res) { // found something
        var token = crypto.randomBytes(64).toString('base64');
        var user = new SERVER.User({
          id: res._id, // id from database
          socket: SERVER.getSocketById(data.socket_id),
          username: data.username,
          char_id: res.char_id,
        });
        SERVER.Sessions[token] = user;
        user.getObject().then((obj) => {
          resolve({
            status: 1,
            token: token,
            user: obj,
          });
        });
      } else { // found nothing
        resolve({ status: 0 });
      }
    });
  });
};

SERVER.getItems = function (type, order) {
  return new Promise((resolve, reject) => {
    SERVER.db.items.find({ type: type }, { _id: 0, desc: 0 }, function (err, res) {
      if (res[0]) {
        resolve(res.sort((a, b) => { return a.req[order] - b.req[order] }));
      }
    });
  });
};

SERVER.getSkills = function (type, order) {
  return new Promise((resolve, reject) => {
    SERVER.db.skills.find({ type: type }, { _id: 0 }, function (err, res) {
      if (res[0]) {
        resolve(res.sort((a, b) => { return a.req[order] - b.req[order] }));
      }
    });
  });
};

SERVER.getGETResponse = function (obj) {
  return new Promise((resolve, reject) => {
    // TODO: get cookie token and check if exists
    switch (obj.ajax_action) {
      case 'get-items':
        SERVER.getItems(parseInt(obj.type), parseInt(obj.order)).then(resolve);
        break;
      case 'get-skills':
        SERVER.getSkills(parseInt(obj.type), parseInt(obj.order)).then(resolve);
        break;
      default:
        resolve({});
        break;
    }
  });
};

SERVER.getPOSTResponse = function (obj) {
  return new Promise((resolve, reject) => {
    var time = new Date();
    console.log("[" + time.toString().substring(16, 24) + "|" + obj.ajax_action + "]" + " T:" + obj.token);
    switch (obj.ajax_action) {
      case "login":
        SERVER.loginUser(obj).then(resolve);
        break;
      case "register":
        SERVER.createUser(obj).then(resolve);
        break;
      case "authenticate":
        SERVER.getUser(obj).then(resolve);
        break;
      case "equip-item":
        SERVER.equipItem(obj).then(resolve);
        break;
      case "get-character":
        obj._user.getCharacter().then(resolve);
        break;
      case "activate-skill":
        SERVER.activateSkill(obj).then(resolve);
        break;
      case "deactivate-skill":
        SERVER.deactivateSkill(obj).then(resolve);
        break;
      case "level-stat":
        SERVER.levelUpStat(obj).then(resolve);
        break;
      default:
        resolve({});
        break;
    }
  });
};

SERVER.levelUpStat = function (obj) {
  return new Promise ((resolve, reject) => {
    if (obj._user.character.points > 0) {
      var plus = SHARED.getStatPlusAmount(obj._user.character.stats[obj.stat]);
      update = { $inc: {
        pts: -1,
      } };
      update.$inc[obj.stat] = plus;
      SERVER.db.characters.update({ _id: obj._user.char_id }, update, function (err, res) {
        if (res) {
          obj._user.character.stats[obj.stat] += plus;
          obj._user.character.points--;
          resolve ({ status: 1 });
        } else     resolve ({ status: 0, msg: "Leveling up stat failed." });
      });
    } else resolve ({ status: 0, msg: "You don't have any more skill points." });
  });
};

SERVER.equipItem = function (obj) {
  return new Promise ((resolve, reject) => {
    // check if user has requirements
    var char = obj._user.character;
    obj.id = parseInt(obj.id);
    SERVER.db.items.findOne({ id: obj.id }, function (err, res) {
      if (res) {
        if (SERVER.meetRequirements(char, res.req)) {
          var types = ['none', 'weapon', 'bow', 'armor', 'charm', 'bomb', 'trap'];
          var update = { $set: {} };
          update.$set[types[res.type]] = obj.id;
          char[types[res.type]] = obj.id;
          SERVER.db.characters.update({ _id: char.id }, update, function (err2, res2) {
            if (res) { // item equipped, recalculate char weight
              SERVER.db.items.find({ id: {
                $in: [char.weapon, char.bow, char.armor, char.bomb, char.trap]
              }}, function (err3, res3) {
                var w = 0;
                for (var i = 0; i < res3.length; ++i) {
                  w += res3[i].weight;
                }
                char.kg = w;
                SERVER.db.characters.update({ _id: char.id }, { $set: { kg: w } }, function (err4, res4) {
                  if (res) resolve({ status: 1 });
                  else resolve({ status: 0, msg: "Failed weight recalculation." });
                });
              });
            } else resolve({ status: 0, msg: "Failed to equip the item." });
          });
        } else {
          resolve({ status: 0, msg: "You don't meet the requirements to equip this item." });
        }
      } else resolve({ status: 0, msg: "The item you are trying to equip does not exist." });
    });
  });
};

SERVER.activateSkill = function (obj) {
  return new Promise ((resolve, reject) => {
    // check if user has requirements
    var char = obj._user.character;
    obj.id = parseInt(obj.id);
    SERVER.db.skills.findOne({ id: obj.id }, function (err, res) {
      if (res) {
        if (res.enabled) {
          if (SERVER.meetRequirements(char, res.req)) {
            var types = ['none', 'melee', 'range', 'movement', 'defense', 'magic', 'magic2', 'magic', 'magic2'];
            if (char[types[res.type]].length + 1 <= SHARED.skillLimit[types[res.type]]) {
              var update = { $set: {} };
              char[types[res.type]].push(obj.id);
              update.$set[types[res.type]] = char[types[res.type]];
              SERVER.db.characters.update({ _id: char.id }, update, function (err2, res2) {
                if (res) {
                  resolve({ status: 1 });
                } else resolve({ status: 0, msg: "Error. Cannot activate this " + (res.type > 4 ? "spell." : "skill.") });
              });
            } else resolve({ status: 0, msg: "You have reached the limit of active " + (res.type > 4 ? "spells" : "skills") + " of this type." });
          } else resolve({ status: 0, msg: "You don't meet the requirements to use this " + (res.type > 4 ? "spell" : "skill") + "." });
        } else resolve({ status: 0, msg: "The skill is disabled and cannot be activated." });
      } else resolve({ status: 0, msg: "The " + (res.type > 4 ? "spell" : "skill") + " you are trying to activate does not exist." });
    });
  });
};

SERVER.deactivateSkill = function (obj) {
  return new Promise ((resolve, reject) => {
    // check if user has requirements
    var char = obj._user.character;
    obj.id = parseInt(obj.id);
    SERVER.db.skills.findOne({ id: obj.id }, function (err, res) {
      if (res) {
        var types = ['none', 'melee', 'range', 'movement', 'defense', 'magic', 'magic2', 'magic', 'magic2'];
        var update = { $set: {} };
        var index = char[types[res.type]].indexOf(obj.id);
        if (index >= 0) {
          char[types[res.type]].splice(index, 1);
          update.$set[types[res.type]] = char[types[res.type]];
          SERVER.db.characters.update({ _id: char.id }, update, function (err2, res2) {
            if (res) {
              resolve({ status: 1 });
            } else resolve({ status: 0, msg: "Error. Cannot deactivate this " + (res.type > 4 ? "spell." : "skill.") });
          });
        } else resolve({ status: 0, msg: "You cannot deactivate what's inactive." });
      } else resolve({ status: 0, msg: "The " + (res.type > 4 ? "spell" : "skill") + " you are trying to deactivate does not exist." });
    });
  });
};

SERVER.meetRequirements = function (char, req) {
  var meet = true;
  var s = ['to', 'st', 'dx', 'in', 'wi', 'sp'];
  for (var i = 0; i < req.length; ++i) {
    if (char.stats[s[i]] < req[i]) meet = false;
  }

  return meet;
};

SERVER.Player = function (user) {
  this.user = user;
  this.state = 0; // 0 - idle, 1 - in-game
  this.game = null;
  this.gameState = {
    hp: 0,
    tile: null,
    buffs: null,
  }
};

SERVER.Player.prototype.moveToPosition = function (newPos, dontTriggerTraps) {
  var current = this.gameState.tile;
  var newTile = this.game.arena.getTileByPos(newPos);

  current.player = null;
  newTile.player = this;
  this.gameState.tile = newTile;

  if (!dontTriggerTraps && newTile.trap) {
    console.log("TODO: Traps");
  }
};


SERVER.Player.prototype.getActiveActions = function () {
  var scope = this;
  return new Promise((resolve, reject) => {
    var types = ['', 'MELEE', 'RANGE', 'MOVE', 'DEFEND', 'MAGIC', 'MAGIC2', 'MAGIC', 'MAGIC2'];
    var skills_id = [];
    var skills = {};
    skills_id = scope.user.character.movement.concat(scope.user.character.melee, scope.user.character.range, scope.user.character.defense, scope.user.character.magic, scope.user.character.magic2);
    SERVER.db.skills.find({ id: { $in: skills_id } }, function (err, res) {
      if (res) {
        for (var i = 0; i < res.length; ++i) {
          var key = types[res[i].type] + "-" + res[i].name.replace(/\s/g, '_').toUpperCase();
          skills[key] = {
            id: res[i].id,
            cost: res[i].energy,
          }
        }
        skills['END-END_TURN'] = { id: -1, cost: 0 };
        skills['END-FORFEIT_GAME'] = { id: -2, cost: 0 };
        resolve(skills);
      } else {
        console.log("Error: getActiveActionArray() - cannot get skills from db");
      }
    });
  });
};

SERVER.updateUserChallenges = function (user_id) {
  var received_challenges = [];
  var sent_challenges = [];
  for (var i in SERVER.Challenges) {
    var ch = SERVER.Challenges[i];
    if (ch.receiver.user.id == user_id) {
      received_challenges.push({
        id: ch.id,
        name: ch.sender.user.name,
        lvl: ch.sender.user.character.xp,
        respect: ch.sender.user.character.respect,
      });
    } else if (ch.sender.user.id == user_id) {
      sent_challenges.push({
        id: ch.id,
        name: ch.receiver.user.name,
        lvl: ch.receiver.user.character.xp,
        respect: ch.receiver.user.character.respect,
      });
    }
  }

  SERVER.getPlayerById(user_id).user.socket.emit('challenges-update', { sent: sent_challenges, received: received_challenges });

};

SERVER.Challenge = function (sender_id, receiver_id) {
  this.id = SERVER.counter++;
  this.sender = SERVER.getPlayerById(sender_id);
  this.receiver = SERVER.getPlayerById(receiver_id);
  this.game = null;

  SERVER.Challenges[this.id] = this;

  console.log("Player '" + this.sender.user.name + "' challenged player '" + this.receiver.user.name + "'");

  SERVER.updateUserChallenges(this.receiver.user.id);
  SERVER.updateUserChallenges(this.sender.user.id);
};

SERVER.Challenge.prototype.accept = function () {
  if (this.sender.game != null /*|| player_offline*/) {
    // challenge accept failed, sender already in game with another player or went offline
    SERVER.getPlayerById(this.receiver.user.id).user.socket.emit('challenge-failed', {player: this.sender.user.name, ch_id: this.id});
  } else {
    // reject + withdraw all challenges of both players except this one
    this.removeOtherParticipantChallenges();
    var game = new SERVER.Game(this);
    SERVER.Games[game.id] = game;
    this.game = game;
    this.receiver.game = game;
    this.sender.game = game;

    SERVER.getPlayerById(this.receiver.user.id).user.socket.emit('alert', { content: "Game will be starting soon...", no_ok: true });
    SERVER.getPlayerById(this.sender.user.id).user.socket.emit('alert', { content: this.receiver.user.name + " agreed to duel you. Game will be starting soon...", no_ok: true });

    setTimeout(function () {
      game.begin();
    }, 3000);
  }

  console.log("Player '" + this.receiver.user.name + "' agreed to duel '" + this.sender.user.name + "'");
};

SERVER.Challenge.prototype.withdraw = function () {
  var rid = this.receiver.user.id;
  var sid = this.sender.user.id;
  delete SERVER.Challenges[this.id];
  SERVER.updateUserChallenges(rid);
  SERVER.updateUserChallenges(sid);
};

SERVER.Challenge.prototype.reject = function () {
  var rid = this.receiver.user.id;
  var sid = this.sender.user.id;
  delete SERVER.Challenges[this.id];
  SERVER.updateUserChallenges(rid);
  SERVER.updateUserChallenges(sid);
  console.log("Player '" + this.receiver.user.name + "' rejected to duel '" + this.sender.user.name+ "'");
};

SERVER.Challenge.prototype.removeOtherParticipantChallenges = function () {
  var ids = [];
  for (var i in SERVER.Challenges) {
    var ch = SERVER.Challenges[i];
    if (ch.sender == this.sender
     || ch.sender == this.receiver
     || ch.receiver == this.sender
     || ch.receiver == this.receiver) {
       delete SERVER.Challenges[ch.id];
       if (ids.indexOf(ch.sender.user.id) == -1) ids.push(ch.sender.user.id);
       if (ids.indexOf(ch.receiver.user.id) == -1) ids.push(ch.receiver.user.id);
     }
  }

  for (var i = 0; i < ids.length; ++i) {
    SERVER.updateUserChallenges(ids[i]);
  }
};

SERVER.Tile = function (arena, x, y) {
  this.arena = arena;
  this.trap = null;
  this.obstacle = 0;
  this.player = null;
  this.pos = {x: x, y: y};
};

SERVER.Arena = function (game) {
  this.game = game;
  this.tiles = [];

  for (var i = 0; i < 4; ++i) {
    this.tiles.push([]);
    for (var j = 0; j < 6; ++j) {
      this.tiles[i].push(new SERVER.Tile(this, j, i));
    }
  }
};

SERVER.Arena.prototype.getRandomEmptyTile = function () {
  var emptyTiles = [];
  for (var i = 0; i < this.tiles.length; ++i) {
    for (var j = 0; j < this.tiles[i].length; ++j) {
      if (this.tiles[i][j].obstacle == 0 && this.tiles[i][j].player == null) {
        emptyTiles.push(this.tiles[i][j]);
      }
    }
  }
  var random = emptyTiles[Math.floor(Math.random() * (emptyTiles.length))];
  return random;
};

SERVER.Arena.prototype.getRandomAdjacentTile = function (pos) {
  var emptyTiles = [];
  for (var i = 0; i < this.tiles.length; ++i) {
    for (var j = 0; j < this.tiles[i].length; ++j) {
      if (SHARED.arePositionsAdjacent(pos, {x: j, y: i}) && this.tiles[i][j].obstacle == 0 && this.tiles[i][j].player == null) {
        emptyTiles.push(this.tiles[i][j]);
      }
    }
  }
  var random = emptyTiles[Math.floor(Math.random() * (emptyTiles.length))];
  return random;
};

SERVER.Arena.prototype.getTileByPos = function (pos) {
  return this.tiles[pos.y][pos.x];
};

SERVER.Game = function (challenge) {
  this.id = SERVER.counter++;
  this.player1 = challenge.sender;
  this.player2 = challenge.receiver;
  this.time = 0;
  this.player1_actions = [];
  this.player2_actions = [];
  this.state = 0;
  this.arena = new SERVER.Arena(this);
  this.SHARED = SHARED;
  this.SERVER = SERVER;
};

SERVER.Game.prototype.getEnemy = function (player) {
  return this.player1 == player ? this.player2 : this.player1;
};

SERVER.Game.prototype.begin = function (challenge) {
  this.state = 1;

  // initialize players' hitpoints and other stuff (mastery of skills etc)
  this.player1.gameState.hp = this.player1.user.character.stats.to * 5;
  this.player2.gameState.hp = this.player2.user.character.stats.to * 5;

  // initialize player's starting positions
  var p1tile = this.arena.getRandomEmptyTile();
  p1tile.player = this.player1;
  this.player1.gameState.tile = p1tile;
  var p2tile = this.arena.getRandomEmptyTile();
  p2tile.player = this.player2;
  this.player2.gameState.tile = p2tile;

  // initialize players' buffs objects
  this.player1.gameState.buffs = new SERVER.Buffs(this.player1);
  this.player2.gameState.buffs = new SERVER.Buffs(this.player2);

  // copy equipped items and active skills to make sure user doesnt change them during fight
  var c1 = this.player1.user.character;
  this.player1.kg = c1.kg;
  this.player1.items = {
    weapon: c1.weapon,
    bow: c1.bow,
    armor: c1.armor,
    bomb: c1.bomb,
    trap: c1.trap,
  };
  this.player1.skills = {
    movement: c1.movement.slice(),
    melee: c1.melee.slice(),
    range: c1.range.slice(),
    defense: c1.defense.slice(),
    magic: c1.magic.slice(),
    magic2: c1.magic2.slice(),
  }

  var c2 = this.player2.user.character;
  this.player2.kg = c2.kg;
  this.player2.items = {
    weapon: c2.weapon,
    bow: c2.bow,
    armor: c2.armor,
    bomb: c2.bomb,
    trap: c2.trap,
  };
  this.player2.skills = {
    movement: c2.movement.slice(),
    melee: c2.melee.slice(),
    range: c2.range.slice(),
    defense: c2.defense.slice(),
    magic: c2.magic.slice(),
    magic2: c2.magic2.slice(),
  }

  // emit game info to players while hiding some enemy info
  var weps = ['sword', 'axe', 'hammer'];
  var bows = ['bow', 'fire-bow'];
  var bombs = ['bomb', 'fire-bomb'];

  var d1 = this.getDataForClient(this.player1);
  d1.p.weapon = weps.indexOf(SHARED.getWeaponType(c1.weapon));
  d1.p.bow = bows.indexOf(SHARED.getWeaponType(c1.bow));
  d1.p.bomb = bombs.indexOf(SHARED.getWeaponType(c1.bomb));
  d1.e.weapon = weps.indexOf(SHARED.getWeaponType(c2.weapon));
  d1.e.bow = bows.indexOf(SHARED.getWeaponType(c2.bow));
  d1.e.bomb = bombs.indexOf(SHARED.getWeaponType(c2.bomb));

  var d2 = this.getDataForClient(this.player2);
  d2.p.weapon = weps.indexOf(SHARED.getWeaponType(c2.weapon));
  d2.p.bow = bows.indexOf(SHARED.getWeaponType(c2.bow));
  d2.p.bomb = bombs.indexOf(SHARED.getWeaponType(c2.bomb));
  d2.e.weapon = weps.indexOf(SHARED.getWeaponType(c1.weapon));
  d2.e.bow = bows.indexOf(SHARED.getWeaponType(c1.bow));
  d2.e.bomb = bombs.indexOf(SHARED.getWeaponType(c1.bomb));

  var scope = this;
  this.player1.getActiveActions().then((res) => {
    d1.p.actions = res;
    scope.player2.getActiveActions().then((res2) => {
      d2.p.actions = res2;

      scope.player1.user.socket.emit('game-start', d1);
      scope.player2.user.socket.emit('game-start', d2);

      setTimeout (scope.turnStart.bind(this), 5000);
    });
  });
};

SERVER.Game.prototype.end = function () {
  this.player1.game = null;
  this.player2.game = null;

  delete SERVER.Games[this.id];
  console.log("Game ended");
};

SERVER.Game.prototype.getDataForClient = function (player) {
  if (player == this.player1) {
    var p = this.player1;
    var e = this.player2;
  } else {
    var p = this.player2;
    var e = this.player1;
  }
  var data = {
    p: {
      id: p.user.id,
      name: p.user.name,
      posx: p.gameState.tile.pos.x,
      posy: p.gameState.tile.pos.y,
      hp: p.gameState.hp,
    },
    e: {
      id: e.user.id,
      name: e.user.name,
      posx: e.gameState.tile.pos.x,
      posy: e.gameState.tile.pos.y,
    }
  };

  return data;
};

SERVER.Game.prototype.turnStart = function () {
  // reset player actions
  this.player1_actions = [];
  this.player2_actions = [];

  this.player1.gameState.buffs.empty();
  this.player2.gameState.buffs.empty();

  // turn started, timer for action input
  this.time = + new Date() + SERVER.turnTime * 1000;

  // emit turn start to playres and let them know the timer
  var d1 = this.getDataForClient(this.player1);
  var d2 = this.getDataForClient(this.player2);
  var s1 = this.player1.user.socket;
  var s2 = this.player2.user.socket;
  if (!s1 && !s2) {
    console.log("Both players disconnected... Player with more %HP left wins...");
    this.end();
    return;
    // TODO: player with more %HP wins
  }
  if (s1) s1.emit('turn-start', {time: this.time, data: d1});
  if (s2) s2.emit('turn-start', {time: this.time, data: d2});

  console.log("Turn started! Waiting for players to comit their actions.");

  // set a timeout for turn ended
  var scope = this;
  this.timeout = setTimeout (function () {
    setTimeout(function () {
      // wait for some time for late commits
      console.log("Giving a second for late commits to arrive");
      scope.turnEnd();
    }, 1000);
  }, SERVER.turnTime * 1000);
};

SERVER.Game.prototype.isSkillActive = function (player, id) {
  id = parseInt(id);
  var active = (player.skills.defense.indexOf(id) != -1
             || player.skills.melee.indexOf(id)   != -1
             || player.skills.range.indexOf(id)   != -1
             || player.skills.movement.indexOf(id)!= -1
             || player.skills.magic.indexOf(id)   != -1
             || player.skills.magic2.indexOf(id)  != -1)
  return active;
};

SERVER.getSkillInfo = function (id) {
  for (var i = 0; i < SERVER.SKILL_INFO.length; ++i) {
    if (SERVER.SKILL_INFO[i].id == id)
      return SERVER.SKILL_INFO[i];
  }
  return null;
};

SERVER.getItemInfo = function (id) {
  for (var i = 0; i < SERVER.ITEM_INFO.length; ++i) {
    if (SERVER.ITEM_INFO[i].id == id)
      return SERVER.ITEM_INFO[i];
  }
  return null;
};

SERVER.spMultiplier = function (lvl) {
	return 0.0000515768 * (lvl * lvl) + 0.0117227 * lvl + 0.964368;
}

SERVER.stMultiplier = function (lvl) {
  return 0.956667 + 0.0144872 * lvl - 0.000014245 * (lvl * lvl);
};

SERVER.dxMultiplier = function (lvlDiff) {
  return 0.000755556 * (lvlDiff * lvlDiff) + 0.0106667 * lvlDiff + 1;
};

SERVER.precMultiplier = function (lvl) { // 68 = 1.2x
  return 0.00307692 * lvl + 0.990769;
};

SERVER.inMultiplier = function (lvl) {
  return 0.956667 + 0.0144872 * lvl - 0.000014245 * (lvl * lvl);
};

SERVER.wiMultiplier = function (lvl) {
  return 0.000161515 * (lvl * lvl) - 0.00321606 * lvl + 0.0181945;
};

SERVER.Game.prototype.getSkillTime = function (player, id) {
  var skill = SERVER.getSkillInfo(id);
  var speed = skill.speed;
  var mlt = SERVER.spMultiplier(player.user.character.stats.sp);
  if (skill.type == 1) { // melee - wep speed, skill speed, sp stat
    if (skill.id == 96) { // place trap - trap speed
      var trap = SERVER.getItemInfo(player.items.trap);
      speed *= trap.value2 / 100 / mlt;
    } else {
      var wep = SERVER.getItemInfo(player.items.weapon);
      speed *= wep.value2 / 100 / mlt;
    }
  } else if (skill.type == 2) { // range - wep speed, skill speed, sp stat
    if (skill.id == 109) { // toss bomb - bomb speed
      var bomb = SERVER.getItemInfo(player.items.bomb);
      speed *= bomb.value2 / 100 / mlt;
    } else {
      var bow = SERVER.getItemInfo(player.items.bow);
      speed *= bow.value2 / 100 / mlt;
    }
  } else if (skill.type == 3) { // movement - overweight, skill speed, sp stat
    var ow = Math.max(0, player.user.character.stats.st - player.kg);
    speed /= mlt * ((ow * ow) / 600 + ow / 60 + 1);
  } else if (skill.type >= 4 & skill.type <= 8) { // defense, spectral, guardian, bane, spirit - skill speed, sp stat
    speed /= mlt;
  }
  return speed;
};

SERVER.Game.prototype.turnEnd = function () { // called when a turn ends
  console.log("Turn ended! Processing players' actions and emitting results of this turn.");

  var allActions = [];
  var clientActions = [];
  this.processedActions = [];
  var p_actions = {};

  // process all actions of p1 into {timestamp: action, timestamp: action}
  function addToTimeline (time, obj) {
    if (p_actions.hasOwnProperty(time)) {
      addToTimeline(time + Math.random() - 0.5, obj);
    } else {
      p_actions[time] = obj;
    }
  }

  var energyLeft = 100;
  var tstamp = Math.random();
  for (var i = 0; i < this.player1_actions.length; ++i) {
    var act = this.player1_actions[i];
    if (this.isSkillActive(this.player1, act.id)) {
      if (act.action.split('-')[0] == 'move' && act.action.split('-')[1] != 'wait' && act.action.split('-')[1] != 'panic' && act.action.split('-')[1] != 'back_away') {
        for (var j = 0; j < act.data.length; ++j) {
          energyLeft -= SERVER.getSkillInfo(act.id).energy;
          if (energyLeft < 0) break;
          tstamp += this.getSkillTime(this.player1, act.id) + Math.random() - 0.5;
          addToTimeline(tstamp, {player: this.player1, action: {id: act.id, action: act.action, data: act.data[j]}});
        }
      } else {
        energyLeft -= SERVER.getSkillInfo(act.id).energy;
        if (energyLeft < 0) break;
        tstamp += this.getSkillTime(this.player1, act.id) + Math.random() - 0.5;
        addToTimeline(tstamp, {player: this.player1, action: act});
      }
    }
  }
  // process all actions of p2 into {timestamp: action, timestamp: action}
  energyLeft = 100;
  tstamp = Math.random();
  for (var i = 0; i < this.player2_actions.length; ++i) {
    var act = this.player2_actions[i];
    if (this.isSkillActive(this.player2, act.id)) {
      if (act.action.split('-')[0] == 'move' && act.action.split('-')[1] != 'wait' && act.action.split('-')[1] != 'panic' && act.action.split('-')[1] != 'back_away') {
        for (var j = 0; j < act.data.length; ++j) {
          energyLeft -= SERVER.getSkillInfo(act.id).energy;
          if (energyLeft < 0) break;
          tstamp += this.getSkillTime(this.player2, act.id) + Math.random() - 0.5;
          addToTimeline(tstamp, {player: this.player2, action: {id: act.id, action: act.action, data: act.data[j]}});
        }
      } else {
        energyLeft -= SERVER.getSkillInfo(act.id).energy;
        if (energyLeft < 0) break;
        tstamp += this.getSkillTime(this.player2, act.id) + Math.random() - 0.5;
        addToTimeline(tstamp, {player: this.player2, action: act});
      }
    }
  }

  // merge both action objects into one by timestamps
  var keys = Object.keys(p_actions);
  keys.sort(function(a, b) {
    return a - b;
  });

  for (var i = 0; i < keys.length; ++i) {
    p_actions[keys[i]].timestamp = keys[i];
    allActions.push(p_actions[keys[i]]);
  }

  // process actions one by one [some logic to be shared with client side or replicated 1:1]
  this.realtime = 0;
  for (var i = 0; i < allActions.length; ++i) {
    var action = new SERVER.GameAction({
      game: this,
      player: allActions[i].player,
      action: allActions[i].action,
      timestamp: allActions[i].timestamp,
    });
    action.process();

    // check if any player died
    if (this.player1.gameState.hp <= 0) {
      // player 1 died, finish game and send battle report
      var report = this.getBattleReport(this.player2, this.player1);
      this.processedActions.push({
        clientData: {
          playerId: this.player1.user.id,
          enemyId: this.player2.user.id,
          type: 'death',
          data: {report: report, taunt: "Die weakling!"},
          time: 2000,
        },
        include: true,
        timestamp: allActions[i].timestamp + 100000,
      });
      break;
    } else if (this.player2.gameState.hp <= 0) {
      // player 2 died, finish game and send battle report
      var report = this.getBattleReport(this.player1, this.player2);
      this.processedActions.push({
        clientData: {
          playerId: this.player2.user.id,
          enemyId: this.player1.user.id,
          type: 'death',
          data: {report: report, taunt: "Die weakling!"},
          time: 2000,
        },
        include: true,
        timestamp: allActions[i].timestamp + 100000,
      });
      break;
    }
  }

  // after processing all actions, fill client actions array to be sent to clients
  for (var i = 0; i < this.processedActions.length; ++i) {
    var pa = this.processedActions[i];
    if (pa.include) {
      // don't push defend actions, they are only needed on server side
      clientActions.push(pa.clientData);
    }
  }

  // emit action list to players to visualize
  var socket1 = this.player1.user.socket;
  if (socket1) socket1.emit('turn-process', {actions: clientActions});

  var socket2 = this.player2.user.socket;
  if (socket2) socket2.emit('turn-process', {actions: clientActions});



  // calculate the time it takes to display all the actions on client side and
  // after that time start a new turn if no player reached 0 hp
  if (this.player1.gameState.hp > 0 && this.player2.gameState.hp > 0) {
    var scope = this;
    this.timeout = setTimeout(function () {
      scope.turnStart();
    }, this.realtime + 1000);
  } else {
    this.end();
  }

};

SERVER.Game.prototype.getBattleReport = function (winner, loser) {
  var xp_per_win = 100;

  var w_lvl_info = SHARED.getLvlInfo(winner.user.character.xp);
  var l_lvl_info = SHARED.getLvlInfo(loser.user.character.xp);
  var w_lvl_info_a = SHARED.getLvlInfo(winner.user.character.xp + xp_per_win);
  var l_lvl_info_a = SHARED.getLvlInfo(loser.user.character.xp + xp_per_win / 2);
  var respect_gain = this.getRespectGain(w_lvl_info.lvl, l_lvl_info.lvl);
  if (loser.user.character.respect + respect_gain.l < 0) {
    respect_gain.l = -loser.user.character.respect;
  }

  var w_lvlup = l_lvlup = 0;
  if (w_lvl_info_a.lvl > w_lvl_info.lvl) {
    w_lvlup = 1;
    winner.user.character.points += 2;
  }
  if (l_lvl_info_a.lvl > l_lvl_info.lvl) {
    l_lvlup = 1;
    loser.user.character.points += 2;
  }

  SERVER.db.characters.update({ _id: winner.user.char_id }, { $inc: {
    xp: xp_per_win,
    respect: respect_gain.w,
    pts: w_lvlup ? 2 : 0,
  }}, function (err, res) {
    SERVER.db.characters.update({ _id: loser.user.char_id }, { $inc: {
      xp: xp_per_win / 2,
      respect: respect_gain.l,
      pts: l_lvlup ? 2 : 0,
    }}, function (err2, res2) {
      SERVER.db.finished_battles.insert({ winner: winner.user.id, loser: loser.user.id, w_lvl: w_lvl_info.lvl, l_lvl: l_lvl_info.lvl, w_res: winner.user.character.respect, l_res: loser.user.character.respect }, function (err3, res3) {
        winner.user.character.xp += xp_per_win;
        winner.user.character.respect += respect_gain.w;
        loser.user.character.xp += xp_per_win / 2;
        loser.user.character.respect += respect_gain.l;
      });
    });
  });

  return {
    w: {
      r: respect_gain.w,
      p: w_lvl_info_a.progress - w_lvl_info.progress,
      l: w_lvlup,
    },
    l: {
      r: respect_gain.l,
      p: l_lvl_info_a.progress - l_lvl_info.progress,
      l: l_lvlup,
    },
  };
};

SERVER.Game.prototype.getRespectGain = function (w_lvl, l_lvl) {
  var respect = {
    w: 0,
    l: 0,
  }
  var diff = w_lvl - l_lvl;
  if (diff < -12) {
    respect.w = 13;
    respect.l = -1;
  } else if (diff < -8) {
    respect.w = 12;
    respect.l = -2;
  } else if (diff < -4) {
    respect.w = 10;
    respect.l = -4;
  } else if (diff <= 4) {
    respect.w = 7;
    respect.l = -7;
  } else if (diff <= 8) {
    respect.w = 4;
    respect.l = -10;
  } else if (diff <= 12) {
    respect.w = 2;
    respect.l = -12;
  } else {
    respect.w = 1;
    respect.l = -13;
  }
  return respect;
};

SERVER.Game.prototype.comitActions = function (player, actions) {
  if (this.player1 == player) this.player1_actions = actions;
  else if (this.player2 == player) this.player2_actions = actions;

  console.log("Received actions from " + player.name + ": " + actions);
};

SERVER.Game.prototype.isTileOccupied = function (tile) {
  return (tile.obstacle != 0 || tile.player != null);
};

// Buffs
// types of buffs: Action Passive, Turn Passive, Next Action (Single or Multiple)
SERVER.Buffs = function (player) {
  this.player = player;
  this.game = player.game;
  this.list = {};
};

SERVER.Buffs.prototype.addTimedPassive = function (name, value, expire) {
  this.list[name] = {
    type: 'timed-passive',
    expire: expire,
    value: value,
  };
};

SERVER.Buffs.prototype.addTurnPassive = function (name, value) {
  this.list[name] = {
    type: 'turn-passive',
    value: value,
  };
};


SERVER.Buffs.prototype.addNextActionBuff = function (buff) {
  this.list[buff.name] = {
    type: 'next-action',
    actionsLeft: buff.actionCount,
    value: buff.value,
  };
};


SERVER.Buffs.prototype.valueByName = function (name) {
  return this.list[name].value;
};

SERVER.Buffs.prototype.useNextActionBuff = function (name) {
  if (this.list.hasOwnProperty(name)) {
    this.list[name].actionsLeft--;
    if (this.list[name].actionsLeft == 0) {
      this.remove(name);
    }
  }
};

SERVER.Buffs.prototype.remove = function (name) {
  delete this.list[name];
};

SERVER.Buffs.prototype.empty = function () {
  this.list = {};
};

SERVER.Buffs.prototype.getActiveBuff = function (name, timestamp) {
  timestamp = timestamp || 0;
  for (var i in this.list) {
    if (i == name) {
      if (this.list[i].type == 'timed-passive' && this.list[i].expire < timestamp)
        continue;
      return this.list[i];
    }
  }
  return null;
};
/*
SERVER.Buffs.prototype.isActive = function (name, timestamp) {
  timestamp = timestamp || 0;
  for (var i in this.list) {
    if (i == name) {
      if (this.list[i].type == 'timed-passive' && this.list[i].expire < timestamp)
        continue;
      return true;
    }
  }
  return false;
};
*/
SERVER.getSocketById = function (id) {
  for (var i in SERVER.Sockets) {
    if (SERVER.Sockets[i].id == id)
      return SERVER.Sockets[i];
  }
  return null;
};

SERVER.getPlayerById = function (id) {
  for (var i in SERVER.Sessions) {
    if (SERVER.Sessions[i].id == id)
      return SERVER.Sessions[i].player;
  }
  return null;
};

SERVER.getPlayerBySocket = function (socket) {
  for (var i in SERVER.Sessions) {
    if (SERVER.Sessions[i].socket == socket)
      return SERVER.Sessions[i].player;
  }
  return null;
};

SERVER.getTokenBySocket = function (socket) {
  for (var i in SERVER.Sessions) {
    if (SERVER.Sessions[i].socket == socket)
      return i;
  }
  return null;
};

SERVER.getGameByPlayer = function (player) {
  for (var i in SERVER.Games) {
    if (SERVER.Games[i].player1 == player || SERVER.Games[i].player2 == player)
      return SERVER.Games[i];
  }
  return null;
};

SERVER.init();
SERVER.io.sockets.on('connection', SERVER.onSocketConnection);


SERVER.getOnlineUsers = function () {
  var users = [];
  for (var i in SERVER.Sessions) {
    var user = SERVER.Sessions[i];
    if (!user.dc_timestamp)
      users.push({id: user.id, name: user.name, lvl: user.character.xp, respect: user.character.respect });
  }
  return users;
};

setInterval (function () {
  // manage dc'ed sessions
  /*for (var i in SERVER.Sessions) {
    if (SERVER.Sessions[i].hasOwnProperty('dc_timestamp') && SERVER.Sessions[i].dc_timestamp + 60*2*1000 < (+ new Date())) {
      delete SERVER.Sessions[i];
      console.log("Token " + i + " expired");
    }
  }*/

  // send online list to users
  var users = SERVER.getOnlineUsers();
  var sameOnline = SERVER.lastOnlineList === JSON.stringify(users);

  for (var i in SERVER.Sessions) {
    if (SERVER.Sessions[i]._needsOnlineUpdate || !sameOnline) {
      var socket = SERVER.Sessions[i].socket;
      if (socket) socket.emit('online-players', { players: users });
      SERVER.Sessions[i]._needsOnlineUpdate = false;
    }
  }

  SERVER.lastOnlineList = JSON.stringify(users);
}, 200);

// GameAction

SERVER.GameAction = function (data) {
  //console.log("GAME ACTION DATA: " + data.action.action);
  this._GameActionData = data; // for action duplicating
  this.game = data.game;
  this.player = data.player;
  this.enemy = SERVER.getGameByPlayer(this.player).getEnemy(this.player);
  this.type = data.action.action.split('-')[0];
  this.action = data.action.action.split('-')[1];
  this.skill_info = SERVER.getSkillInfo(data.action.id);
  this.data = data.action.data;
  this.timestamp = parseFloat(data.timestamp);
  this.time = 0;
  this.include = true;

  this.playerTile = this.player.gameState.tile;
  this.enemyTile = this.enemy.gameState.tile;

  this.clientData = {
    playerId: this.player.user.id,
    enemyId: this.enemy.user.id,
    type: this.type,
    data: { name: '', sprite: 0 },
    time: 0,
  };
};

SERVER.GameAction.prototype.doesPlayerFizzle = function (spellChance) {
  var fizzleChance = 0.0;

  var fizzleNA = this.player.gameState.buffs.getActiveBuff('na_fizzle', this.timestamp);
  if (fizzleNA) {
    fizzleChance += fizzleNA.value;
    this.player.gameState.buffs.useNextActionBuff('na_fizzle');
  }

  fizzleChance /= 100;

  return Math.random() > (spellChance - (spellChance * fizzleChance));
};

SERVER.GameAction.prototype.doesEnemyEvade = function (hitChance) {
  var prec = Math.min(1, SERVER.precMultiplier(this.player.user.character.stats.dx - (this.skill_info.req[2] || this.skill_info.req[1])));
  hitChance *= prec;

  var evadeChance = 0.0;

  var evade = this.enemy.gameState.buffs.getActiveBuff('evade', this.timestamp);
  if (evade) evadeChance += evade.value;

  // evasion spell buffs/debuffs
  var evadeSpell = this.enemy.gameState.buffs.getActiveBuff('evade-spell', this.timestamp);
  if (evadeSpell) evadeChance += evadeSpell.value;

  // armour evade penalty
  var armorEvadePenalty = SERVER.getItemInfo(this.enemy.items.armor).value2;
  evadeChance -= armorEvadePenalty;

  evadeChance /= 100;
  evadeChanve = Math.max(0, evadeChance);

  //console.log("hit chance: " + hitChance + ", evade chance: " + evadeChance);
  //console.log("Chance to evade: " + (1.0 - (hitChance - (hitChance * evadeChance))));
  return Math.random() > (hitChance - (hitChance * evadeChance));
};

SERVER.GameAction.prototype.doesEnemyResist = function (spellAccuracy) {
  var prec = Math.min(SERVER.precMultiplier(this.player.user.character.stats.wi - (this.skill_info.req[3] || this.skill_info.req[4])));
  spellAccuracy *= prec;

  var wi = SERVER.wiMultiplier(this.enemy.user.character.stats.wi);
  var resistChance = wi * 100;

  var resist = this.enemy.gameState.buffs.getActiveBuff('resist', this.timestamp);
  if (resist) resistChance += resist.value;

  // resist spell buffs/debuffs
  var resist = this.enemy.gameState.buffs.getActiveBuff('lower-resist', this.timestamp);
  if (resist) resistChance -= resist.value;

  resistChance /= 100;

  return Math.random() > (spellAccuracy - (spellAccuracy * resistChance));
};

SERVER.GameAction.prototype.calculateWeaponDamage = function () {
  var skillBase = this.skill_info.value; // get base damage of the skill
  var st = SERVER.stMultiplier(this.player.user.character.stats.st);
  var weaponModifier = 1; // get weapon modifier
  if (this.skill_info.type == 1 && this.skill_info.id == 96) {
    weaponModifier = SERVER.getItemInfo(this.player.items.trap).value1 / 100;
  } else if (this.skill_info.type == 1) {
    weaponModifier = SERVER.getItemInfo(this.player.items.weapon).value1 / 100;
  } else if (this.skill_info.type == 2 && this.skill_info.id == 109) {
    weaponModifier = SERVER.getItemInfo(this.player.items.bomb).value1 / 100;
  } else if (this.skill_info.type == 2) {
    weaponModifier = SERVER.getItemInfo(this.player.items.bow).value1 / 100;
  }
  var reductionModifier = this.getDamageReduction();
  var increaseModifier = this.getDamageIncrease();

  return Math.floor(skillBase * weaponModifier * reductionModifier * increaseModifier * st);
};

SERVER.GameAction.prototype.calculateSpellDamage = function () {
  var skillBase = this.skill_info.value; // get base damage of the skill
  var int = SERVER.inMultiplier(this.player.user.character.stats.in);

  var reductionModifier = this.getDamageReduction();
  var increaseModifier = this.getDamageIncrease();

  return Math.floor(skillBase * reductionModifier * increaseModifier * int);
};

SERVER.GameAction.prototype.getDamageIncrease = function () {
  var damageIncrese = 1;

  var dmg_increase = this.player.gameState.buffs.getActiveBuff("dmg-increase");
  if (dmg_increase) {
    damageIncrease *= (100 - dmg_increase.value) / 100;
  }

  return damageIncrese;
};

SERVER.GameAction.prototype.getDamageReduction = function () {
  var enemyArmor = SERVER.getItemInfo(this.enemy.items.armor).value1 / 100;
  var damageReduction = 1 - enemyArmor;

  // weapon damage reduction buffs
  if (this.skill_info.type == 1 || this.skill_info.type == 2) {
    var wep_absorb = this.enemy.gameState.buffs.getActiveBuff("weapon-absorb");
    if (wep_absorb) {
      damageReduction *= (100 - wep_absorb.value) / 100;
    }
  }

  // overall damage reduction debuffs (plague)
  var dmg_reduce = this.player.gameState.buffs.getActiveBuff("dmg-reduce");
  if (dmg_reduce) {
    damageReduction *= (100 - dmg_reduce.value) / 100;
  }

  return damageReduction;
};

SERVER.GameAction.prototype.process = function () {

  switch (this.type) {
    case 'move':
    case 'melee':
    case 'range':
    case 'defend':
      this.SKILL(this.type, this.action);
      break;
    case 'magic':
    case 'magic2':
      this.MAGIC(this.action, this.data);
      break;
  }

  this.game.realtime += this.time + SHARED.timeBetweenTurns;
  this.game.processedActions.push(this);

  this.clientData.time = this.time;
}

SERVER.GameAction.prototype.MAGIC = function (action, data) {
  if (SPELLS.close_range.indexOf(action) != -1) {
    this.clientData.data.type = 'close_range';
    this.time = 1250;
  } else if (SPELLS.long_range.indexOf(action) != -1) {
    this.clientData.data.type = 'long_range';
    this.time = 2000;
  } else if (SPELLS.debuff.indexOf(action) != -1) {
    this.clientData.data.type = 'debuff';
    this.time = 1250;
  } else {
    this.clientData.data.type = 'other';
    this.time = 1250;
  }

  if (!SHARED.arePositionsTouching(this.playerTile.pos, this.enemyTile.pos) && this.clientData.data.type == 'close_range') {
    // too far
    this.clientData.data.status = 'far';
  } else if (SHARED.arePositionsTouching(this.playerTile.pos, this.enemyTile.pos) && this.clientData.data.type == 'long_range') {
    // too close
    this.clientData.data.status = 'close';
  } else if (this.doesPlayerFizzle(this.skill_info.precision / 100)) {
    // player fizzled the spell
    this.clientData.data.status = 'fizzle';
  } else if (this.doesEnemyResist(1) && this.clientData.data.type != 'other') {
    // enemy resisted the spell
    this.clientData.data.status = 'resist';
  } else {
    // spell didn't fizzle and was not resisted, range is ok
    SPELLS[this.action](this);
  }

};

SERVER.GameAction.prototype.SKILL = function (type, action) {
  if (type == 'move') {
    this.clientData.type = 'move';
    this.time = 1000;
  } else if (type == 'defend') {
    this.clientData.type = 'defend';
    this.time = 0;
    this.include = false;
  } else if (type == 'melee') {
    this.clientData.type = 'melee';
    this.time = 1250;
  } else {
    this.clientData.type = 'range';
    this.time = 2000;
  }

  if (!SHARED.arePositionsTouching(this.playerTile.pos, this.enemyTile.pos) && this.clientData.type == 'melee' && this.action != 'place_trap') {
    // too far
    this.clientData.data.status = 'far';
  } else if (SHARED.arePositionsTouching(this.playerTile.pos, this.enemyTile.pos) && this.clientData.type == 'range' && this.action != 'toss_bomb') {
    // too close
    this.clientData.data.status = 'close';
  }
  else if ((this.clientData.type == 'melee' || this.clientData.type == 'range') && this.action != 'toss_bomb' && this.action != 'place_trap' && this.doesEnemyEvade(this.skill_info.precision / 100)) {
    // enemy evaded the attack
    this.clientData.data.status = 'evade';
  } else {
    SKILLS[this.action](this);
  }

};

SERVER.level0char = {
  xp: 0,
  pts: 0,
  respect: 0,
  gold: 0,
  to: 9,
  st: 3,
  dx: 3,
  in: 3,
  wi: 3,
  sp: 3,
  weapon: 1,
  bow: 2,
  bomb: 0,
  trap: 0,
  armor: 3,
  kg: 0,
  xplock: 0,
  movement: [3],
  defense: [4],
  melee: [1],
  range: [2],
  magic: [7],
  magic2: [6],
  taunts: ["Muahaha hahaha"]
};

var p1_actions = {
  'MOVE-WALK': 10,
  'MOVE-WAIT': 10,
  'MELEE-HIT': 15,
  'MELEE-AIMED_HIT': 22,
  'RANGE-SHOOT': 22,
  'RANGE-TOSS_BOMB': 33,
  'MAGIC-BLINK': 33,
  'MAGIC-ZAP': 15,
  'MAGIC-ICE_KISS': 22,
  'DEFEND-DODGE': 6,
  'MAGIC2-MAGIC_COAT': 22,
  'MAGIC2-MINOR_CURE': 25,
  'TALK-MUAHAHA_HAHAHA': 0,
  'END-FORFEIT_GAME': 0,
  'END-END_TURN': 0,
};

var p2_actions = p1_actions;

var ACTIONS = {
  MOVE: {
    WALK: {
      name: "Walk",
      energy: 25,
      speed: 100,
    },
    RUN: {
      name: "Run",
      energy: 40,
      speed: 40,
    }
  },
  MELEE: {
    HIT: {
      name: "Hit",
      energy: 40,
      speed: 100,
      damage: 25,
      accuracy: 100,
    },
    HARD_HIT: {
      name: "Hard hit",
      energy: 75,
      speed: 130,
      damage: 60,
      accuracy: 100,
    }
  },
  RANGE: {
    SHOT: {
      name: "Shot",
      energy: 45,
      speed: 90,
      damage: 30,
      accuracy: 100,
    },
    DOUBLE_SHOT: {
      name: "Double shot",
      energy: 75,
      speed: 130,
      damage: 60,
      accuracy: 100,
    },
    TOSS_BOMB: {
      name: "Toss bomb",
      energy: 75,
      speed: 130,
      damage: 60,
      accuracy: 100,
    },
  },
  DEFEND: {
    BLOCK: {
      name: "Block",
      energy: 25,
      speed: 70,
      chance: 40,
    },
    DODGE: {
      name: "Dodge",
      energy: 40,
      speed: 70,
      chance: 55,
    }
  },
  MAGIC: {
    ZAP: {
      name: "Zap",
      energy: 45,
      speed: 100,
      damage: 40,
      accuracy: 75,
    }
  }
}
