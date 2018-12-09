CLIENT.UI = function (client) {
  this.client = client;
  this.current = "main";
  this.dom = document.getElementById("town-middle");
  this.backDom = document.querySelector("#town-top > span.back");
  this.backDom.onclick = this.goBack.bind(this);
  this.setMenu(this.current);

  this.open_top_menu = null;
  this.character_span = document.getElementById("character-span");
  this.challenges_span = document.querySelector("#town-top > span.challenges");

  //this.challenges_open = false;
  this.character_span.onclick = this.toggleTopMenu.bind(this);
  this.challenges_span.onclick = this.toggleTopMenu.bind(this);

  this.loginDom = document.getElementById("login");
  this.townDom = document.getElementById("town");

  this.loginButton = document.getElementById("button.login");
  this.regButton = document.getElementById("button.register");
  this.loginButton.onclick = this.login.bind(this);
  this.regButton.onclick = this.register.bind(this);
}

CLIENT.UI.prototype.screen = function (name) {
  switch (name) {
    case "login":
      CLIENT.ui.loginDom.style.display = "table";
      CLIENT.ui.townDom.style.display = "none";
      break;
    case "town":
      //document.getElementById("character-span").textContent = CLIENT.user.character.name;
      CLIENT.ui.loginDom.style.display = "none";
      CLIENT.ui.townDom.style.display = "block";
      break;
    case "arena":
      break;
  }
};

CLIENT.UI.prototype.setMenu = function (menu) {
  this.current = menu;
  this.dom.innerHTML = "";

  var scope = this;
  function renderMenu (menuObj) {
    scope.dom.classList.remove("block");
    for (var i = 0; i < menuObj.length; ++i) {
      var obj = menuObj[i];
      if (typeof obj === "object") {
        scope.dom.appendChild(scope.createRowWithButton(obj.text, obj.onclick));
      } else {
        if (obj == "logo") scope.dom.appendChild(scope.createLogo());
        else scope.dom.appendChild(scope.createHeader(scope.strings[obj]));
      }
    }

    if (scope.current == "main") {
      scope.backDom.innerHTML = "X";
    } else {
      scope.backDom.innerHTML = "<";
    }
  };

  function renderItemList (list) {
    scope.dom.classList.add("block");
    for (var i = 0; i < list.length; ++i) {
      var item = list[i];
      if (typeof item === "object") {
        scope.dom.appendChild(scope.createItemListItem(item));
      } else {
        scope.dom.appendChild(scope.createHeaderForList(scope.strings[item]));
      }
    }
  }

  function renderSkillList (list) {
    scope.dom.classList.add("block");
    for (var i = 0; i < list.length; ++i) {
      var item = list[i];
      if (typeof item === "object") {
        scope.dom.appendChild(scope.createSkillListItem(item));
      } else {
        scope.dom.appendChild(scope.createHeaderForList(scope.strings[item]));
      }
    }
  }

  if (menu == "arena") {
    renderMenu(this.getArenaList());
  } else if (menu == "weapon" || menu == "bow" || menu == "armor" || menu == "bomb" || menu == "trap") {
    this.getItemList(menu, renderItemList);
  } else if (menu == "movement" || menu == "melee" || menu == "range" || menu == "defense" || menu == "spectral" || menu == "bane" || menu == "guardian" || menu == "spirit") {
    this.getSkillList(menu, renderSkillList);
  } else {
    renderMenu(this.getMenu(menu));
  }
};

CLIENT.UI.prototype.goBack = function () {
  switch (this.current) {
    case "main":
      console.log("logout???");
      break;
    case "arena":
    case "character":
      this.setMenu("main");
      break;
    case "skills":
    case "spells":
    case "equipment":
      this.setMenu("character");
      break;
    case "weapon":
    case "bow":
    case "armor":
    case "bomb":
    case "trap":
      this.setMenu("equipment");
      break;
    case "movement":
    case "melee":
    case "range":
    case "defense":
      this.setMenu("skills");
      break;
    case "spectral":
    case "bane":
    case "guardian":
    case "spirit":
      this.setMenu("spells");
      break;
    default:
      this.setMenu("main");
      break;
  }
};

CLIENT.UI.prototype.getArenaList = function () {
  var menu = [];
  var online = this.client.online.slice();
  var randomPlayers = [];
  var scope = this;
  var amt = Math.min(online.length, 3);

  if (amt == 0) {
    menu.push("arenaEmpty");

    menu.push({
      text: "Refresh",
      onclick: function () {
        scope.setMenu("arena");
      }
    });
  } else {
    menu.push("arenaHeader");

    for (var i = 0; i < amt; i++) {
      var idx = Math.floor(Math.random() * online.length);
      randomPlayers.push(online[idx]);
      online.splice(idx, 1);
    }

    function pushToMenu (name, challenge_info) {
      menu.push({
        text: name,
        onclick: function () {
          var text = challenge_info.name + "<br/>" + "L: " + SHARED.getLvlInfo(challenge_info.lvl).lvl + " R: " + challenge_info.respect;
          var dlg = new Dialog(text, [{
            name: "Challenge",
            callback: function () {
              CLIENT.emit('challenge-player', challenge_info);
            },
          }, {
            name: "Close",
            callback: function () {},
          }]);
          dlg.show();
        },
      });
    }

    for (var i = 0; i < randomPlayers.length; ++i) {
      var player = randomPlayers[i];
      var challenge_info = player;
      pushToMenu(player.name, challenge_info);
    }

    menu.push({
      text: "Next",
      onclick: function () {
        scope.setMenu("arena");
      }
    });
  }

  return menu;
};

CLIENT.UI.prototype.getItemList = function (type, callback) {
  var menu = [];
  var t = 0; var r = 0;

  switch (type) {
    case "weapon":
      menu.push("weaponHeader");
      t = 1; r = 1;
      break;
    case "bow":
      menu.push("bowHeader");
      t = 2; r = 2;
      break;
    case "armor":
      menu.push("armorHeader");
      t = 3; r = 1;
      break;
    case "charm":
      menu.push("charmHeader");
      t = 3;
      break;
    case "bomb":
      menu.push("bombHeader");
      t = 5; r = 2;
      break;
    case "trap":
      menu.push("trapHeader");
      t = 6; r = 1;
      break;
  }

  ajax.get("/ajax?ajax_action=get-items&type=" + t + "&order=" + r, function (res) {
    for (var i in res) {
      var item = res[i];
      menu.push({
        obj: item,
        onclick: function () {},
      });
    }

    callback(menu);
  });

};


CLIENT.UI.prototype.getSkillList = function (type, callback) {
  var menu = [];
  var t = 0; var r= 0;

  switch (type) {
    case "movement":
      menu.push("movementHeader");
      t = 3;
      r = 2;
      break;
    case "melee":
      menu.push("meleeHeader");
      t = 1;
      r = 1;
      break;
    case "range":
      menu.push("rangeHeader");
      t = 2;
      r = 2;
      break;
    case "defense":
      menu.push("defenseHeader");
      t = 4;
      r = 2;
      break;
    case "spectral":
      menu.push("spectralHeader");
      t = 5;
      r = 3;
      break;
    case "bane":
      menu.push("baneHeader");
      t = 7;
      r = 3;
      break;
    case "guardian":
      menu.push("guardianHeader");
      t = 6;
      r = 4;
      break;
    case "spirit":
      menu.push("spiritHeader");
      t = 8;
      r = 4;
      break;
  }

  ajax.get("/ajax?ajax_action=get-skills&type=" + t + "&order=" + r, function (res) {
    for (var i in res) {
      var item = res[i];
      menu.push({
        obj: item,
        onclick: function () {},
      });
    }

    callback(menu);
  });

};

CLIENT.UI.prototype.createRowWithButton = function (text, onclick) {
  var row = document.createElement("div");
  row.classList.add("row");
  var cell = document.createElement("div");
  cell.classList.add("cell");
  var btn = document.createElement("div");
  btn.classList.add("button");

  btn.textContent = text;
  btn.onclick = onclick;

  cell.appendChild(btn);
  row.appendChild(cell);

  return row;
};

CLIENT.UI.prototype.createLogo = function () {
  var row = document.createElement("div");
  row.classList.add("row");
  var cell = document.createElement("div");
  cell.classList.add("cell");
  var logo = document.createElement("div");
  logo.classList.add("logo");

  cell.appendChild(logo);
  row.appendChild(cell);

  return row;
};

CLIENT.UI.prototype.getRequirements = function (reqArray) {
  var stats = ['TO', 'ST', 'DX', 'IN', "WI", 'SP'];
  var meet = true;
  var req = "";
  for (var i = 0; i < reqArray.length; ++i) {
    if (reqArray[i] > 0) {
      req += stats[i] + reqArray[i] + " ";
      if (reqArray[i] > CLIENT.user.character.stats[stats[i].toLowerCase()]) {
        meet = false;
      }
    }
  }
  return {
    meet: meet,
    str: req,
  };
};

CLIENT.UI.prototype.createItemListItem = function (item) {
  var callback = item.callback;
  item = item.obj;

  var block = document.createElement("div");
  block.classList.add("item-block");
  block.dataset.type = "item";
  block.dataset.id = item.id;

  var title = document.createElement("div");
  title.classList.add("title");

  var content = document.createElement("div");
  content.classList.add("content");

  var req = this.getRequirements(item.req);

  if (!req.meet) {
    block.classList.add('disabled');
  }

  if (item.type == 3) { // armor
    if (CLIENT.user.character.armor == item.id) block.classList.add("active");
    title.innerHTML = "<div class='icon " + SHARED.getWeaponType(item.id) + "'></div>" + item.name;
    content.innerHTML = `
      <div><span class="icon absorb"></span><span>` + item.value1 + `</span></div>
      <div><span class="icon evade-penalty"></span><span>` + item.value2 + `</span></div>
      <div><span class="icon req"></span><span>` + req.str + `</span></div>
      <div><span class="icon weight"></span><span>` + item.weight + `</span></div>
    `;
  } else {
    if (item.type == 1) { //sword
      if (CLIENT.user.character.weapon == item.id) block.classList.add("active");
    } else if (item.type == 2) { // bow
      if (CLIENT.user.character.bow == item.id) block.classList.add("active");
    } else if (item.type == 5) { // bomb
      if (CLIENT.user.character.bomb == item.id) block.classList.add("active");
    } else if (item.type == 6) { // trap
      if (CLIENT.user.character.trap == item.id) block.classList.add("active");
    }
    title.innerHTML = "<div class='icon " + SHARED.getWeaponType(item.id) + "'></div>" + item.name;
    content.innerHTML = `
      <div><span class="icon dmg"></span><span>` + item.value1 + `</span></div>
      <div><span class="icon speed"></span><span>` + item.value2 + `</span></div>
      <div><span class="icon req"></span><span>` + req.str + `</span></div>
      <div><span class="icon weight"></span><span>` + item.weight + `</span></div>
    `;
  }

  if (!req.meet) {
    block.onclick = function () {
      var dlg = new Dialog("You don't meet the requirements to equip this item.", [{name:"OK"}]);
      dlg.show();
    };
  } else block.onclick = CLIENT.ui.handleClick.bind(this);
  //block.onclick = item.onclick;

  block.appendChild(title);
  block.appendChild(content);
  return block;
};

CLIENT.UI.prototype.handleClick = function (e) {
  switch (e.currentTarget.dataset.type) {
    case "item":
      this.equipItem(e.currentTarget.dataset.id);
      break;
    case "skill":
      if (e.currentTarget.classList.contains("active"))
        this.deactivateSkill(e.currentTarget.dataset.id);
      else
        this.activateSkill(e.currentTarget.dataset.id);
      break;
  }
};

CLIENT.UI.prototype.equipItem = function (id) {
  ajax.post("equip-item", { id: id }, function (res) {
    if (res.status) {
      // item successfully equiped
      CLIENT.user.updateCharacter(function () {
        var act = document.querySelector(".item-block.active");
        if (act) act.classList.remove("active");
        document.querySelector(".item-block[data-id='" + id + "']").classList.add("active");
      });
    } else {
      var dlg = new Dialog(res.msg, [{name:"OK"}]);
      dlg.show();
    }
  });
};

CLIENT.UI.prototype.activateSkill = function (id) {
  ajax.post("activate-skill", { id: id }, function (res) {
    if (res.status) {
      CLIENT.user.updateCharacter(function () {
        document.querySelector(".item-block[data-id='" + id + "']").classList.add("active");
      });
    } else {
      var dlg = new Dialog(res.msg, [{name:"OK"}]);
      dlg.show();
    }
  });
};

CLIENT.UI.prototype.deactivateSkill = function (id) {
  ajax.post("deactivate-skill", { id: id }, function (res) {
    if (res.status) {
      CLIENT.user.updateCharacter(function () {
        document.querySelector(".item-block[data-id='" + id + "']").classList.remove("active");
      });
    } else {
      var dlg = new Dialog(res.msg, [{name:"OK"}]);
      dlg.show();
    }
  });
};


CLIENT.UI.prototype.createSkillListItem = function (skill) {
  var callback = skill.callback;
  skill = skill.obj;

  var block = document.createElement("div");
  block.classList.add("item-block");
  block.dataset.type = "skill";
  block.dataset.id = skill.id;

  var title = document.createElement("div");
  title.classList.add("title");

  var content = document.createElement("div");
  content.classList.add("content");

  var req = this.getRequirements(skill.req);

  if (!req.meet) {
    block.classList.add('disabled');
  }

  if (!skill.enabled) {
    block.classList.add('unavailable');
  }

  if (skill.type == 3 || skill.type == 4) { // movement/defense
    if (skill.type == 3) {
      if (CLIENT.user.character.movement.indexOf(skill.id) >= 0) block.classList.add('active');
    } else if (skill.type == 4) {
      if (CLIENT.user.character.defense.indexOf(skill.id) >= 0) block.classList.add('active');
    }
    title.innerHTML = skill.name + "<div class='energy'>" + skill.energy + "</div>";
    content.innerHTML = `
      <div><span class="icon speed"></span><span>` + skill.speed + `</span></div>
      <div><span class="icon req"></span><span>` + req.str + `</span></div>
      <div class='desc'>` + skill.desc + `</div>
    `;
  } else if (skill.type == 1 || skill.type == 2) { // melee/range
    if (skill.type == 1) { //melee
      if (CLIENT.user.character.melee.indexOf(skill.id) >= 0) block.classList.add('active');
    } else if (skill.type == 2) { // range
      if (CLIENT.user.character.range.indexOf(skill.id) >= 0) block.classList.add('active');
    }
    title.innerHTML = skill.name + "<div class='energy'>" + skill.energy + "</div>";
    content.innerHTML = `
      <div><span class="icon dmg"></span><span>` + skill.value + `</span></div>
      <div><span class="icon precision"></span><span>` + skill.precision + `</span></div>
      <div><span class="icon speed"></span><span>` + skill.speed + `</span></div>
      <div><span class="icon req"></span><span>` + req.str + `</span></div>
      <div class='desc'>` + skill.desc + `</div>
    `;
  } else if (skill.type == 5 || skill.type == 6) {
    if (skill.type == 5) { // spectral
      if (CLIENT.user.character.magic.indexOf(skill.id) >= 0) block.classList.add('active');
    } else if (skill.type == 6) { // guardian
      if (CLIENT.user.character.magic2.indexOf(skill.id) >= 0) block.classList.add('active');
    }
    title.innerHTML = skill.name + "<div class='energy'>" + skill.energy + "</div>";
    content.innerHTML = `
      <div><span class="icon speed"></span><span>` + skill.speed + `</span></div>
      <div><span class="icon fizzle"></span><span>` + skill.precision + `</span></div>
      <div><span class="icon req"></span><span>` + req.str + `</span></div>
      <div class='desc'>` + skill.desc + `</div>
    `;
  } else if (skill.type == 7 || skill.type == 8) {
    if (skill.type == 7) { // bande
      if (CLIENT.user.character.magic.indexOf(skill.id) >= 0) block.classList.add('active');
    } else if (skill.type == 8) { // spirit
      if (CLIENT.user.character.magic2.indexOf(skill.id) >= 0) block.classList.add('active');
    }
    title.innerHTML = skill.name + "<div class='energy'>" + skill.energy + "</div>";
    content.innerHTML = `
      <div><span class="icon ` + (skill.type == 7 ? 'spell-damage' : 'heal') + `"></span><span>` + skill.value + `</span></div>
      <div><span class="icon fizzle"></span><span>` + skill.precision + `</span></div>
      <div><span class="icon speed"></span><span>` + skill.speed + `</span></div>
      <div><span class="icon req"></span><span>` + req.str + `</span></div>
      <div class='desc'>` + skill.desc + `</div>
    `;
  }

  if (!req.meet) {
    block.onclick = function () {
      var dlg = new Dialog("You don't meet the requirements to use this " + (skill.type > 4 ? "spell" : "skill") + ".", [{name:"OK"}]);
      dlg.show();
    };
  } else block.onclick = CLIENT.ui.handleClick.bind(this);

  block.appendChild(title);
  block.appendChild(content);
  return block;
};

CLIENT.UI.prototype.createHeader = function (html) {
  var row = document.createElement("div");
  row.classList.add("row");
  var cell = document.createElement("div");
  cell.classList.add("cell");
  var header = document.createElement("div");
  header.classList.add("header");

  header.innerHTML = html;

  cell.appendChild(header);
  row.appendChild(cell);

  return row;
};

CLIENT.UI.prototype.createHeaderForList = function (html) {
  var row = document.createElement("div");
  var cell = document.createElement("div");
  var header = document.createElement("div");
  header.classList.add("header");
  header.style.display = "block";

  header.innerHTML = html;

  cell.appendChild(header);
  row.appendChild(cell);

  return row;
};

CLIENT.UI.prototype.getMenu = function (name) {
  if (typeof name === 'object') return name;

  var menu = [];
  var scope = this;
  if (name == "main") {
    menu.push ("logo");
    menu.push ({
      text: "Arena",
      onclick: function () { scope.setMenu("arena"); }
    });
    menu.push ({
      text: "Character",
      onclick: function () { scope.setMenu("character"); }
    });
  } else if (name == "character") {
    menu.push ("charHeader");
    menu.push ({
      text: "Skills",
      onclick: function () { scope.setMenu("skills"); }
    });
    menu.push ({
      text: "Spells",
      onclick: function () { scope.setMenu("spells"); }
    });
    menu.push ({
      text: "Equipment",
      onclick: function () { scope.setMenu("equipment"); }
    });
  } else if (name == "skills") {
    menu.push ({
      text: "Movement (" + CLIENT.user.character.movement.length + "/" + SHARED.skillLimit.movement + ")",
      onclick: function () { scope.setMenu("movement"); }
    });
    menu.push ({
      text: "Melee (" + CLIENT.user.character.melee.length + "/" + SHARED.skillLimit.melee + ")",
      onclick: function () { scope.setMenu("melee"); }
    });
    menu.push ({
      text: "Ranged (" + CLIENT.user.character.range.length + "/" + SHARED.skillLimit.range + ")",
      onclick: function () { scope.setMenu("range"); }
    });
    menu.push ({
      text: "Defensive (" + CLIENT.user.character.defense.length + "/" + SHARED.skillLimit.defense + ")",
      onclick: function () { scope.setMenu("defense"); }
    });
  } else if (name == "spells") {
    var limit1 = CLIENT.user.character.magic.length;
    var limit2 = CLIENT.user.character.magic2.length;
    menu.push ({
      text: "Spectral (" + limit1 + "/" + SHARED.skillLimit.magic + ")",
      onclick: function () { scope.setMenu("spectral"); }
    });
    menu.push ({
      text: "Bane (" + limit1 + "/" + SHARED.skillLimit.magic + ")",
      onclick: function () { scope.setMenu("bane"); }
    });
    menu.push ({
      text: "Guardian (" + limit2 + "/" + SHARED.skillLimit.magic2 + ")",
      onclick: function () { scope.setMenu("guardian"); }
    });
    menu.push ({
      text: "Spirit (" + limit2 + "/" + SHARED.skillLimit.magic2 + ")",
      onclick: function () { scope.setMenu("spirit"); }
    });
  } else if (name == "equipment") {
    menu.push ({
      text: "Weapon",
      onclick: function () { scope.setMenu("weapon"); }
    });
    menu.push ({
      text: "Bow",
      onclick: function () { scope.setMenu("bow"); }
    });
    menu.push ({
      text: "Armor",
      onclick: function () { scope.setMenu("armor"); }
    });
    menu.push ({
      text: "Bomb",
      onclick: function () { scope.setMenu("bomb"); }
    });
    menu.push ({
      text: "Trap",
      onclick: function () { scope.setMenu("trap"); }
    });
  }

  return menu;
};

CLIENT.UI.prototype.toggleTopMenu = function (e) {
  var menu = e.target;
  if (this.open_top_menu == menu) {
    this.open_top_menu.classList.remove("open");
    this.open_top_menu = null;
    this.updateChallengesUI();
    this.updateCharacterUI();
  } else if (menu == this.character_span) {
    this.open_top_menu = menu;
    this.challenges_span.classList.remove("open");
    this.character_span.classList.add("open");
    this.updateChallengesUI();
    this.updateCharacterUI();
  } else if (menu == this.challenges_span) {
    this.open_top_menu = menu;
    this.character_span.classList.remove("open");
    this.challenges_span.classList.add("open");
    this.challenges_span.classList.remove("active");
    this.updateChallengesUI();
    this.updateCharacterUI();
  }
};

CLIENT.UI.prototype.updateCharacterUI = function () {console.log("updating");
  var div = document.getElementById("character-info");
  div.style.display = this.open_top_menu == this.character_span ? "table" : "none";

  var stats_ul = document.getElementById("character-stats");
  stats_ul.innerHTML = "";
  var stats = ['to', 'st', 'dx', 'in', 'wi', 'sp'];
  var char = CLIENT.user.character;
  for (var i = 0; i < stats.length; ++i) {
    var li = document.createElement("li");
    var span = document.createElement("span");
    span.textContent = stats[i].toUpperCase() + ": " + CLIENT.user.character.stats[stats[i]];
    li.appendChild(span);

    if (char.points > 0) {
      var plus = document.createElement("span");
      plus.classList.add("plus");
      plus.textContent = "+" + SHARED.getStatPlusAmount(CLIENT.user.character.stats[stats[i]]);
      plus.dataset.stat = stats[i];
      plus.onclick = CLIENT.ui.levelStat;
      li.appendChild(plus);
    }

    stats_ul.appendChild(li);
  }

  var lvl_info = SHARED.getLvlInfo(char.xp);
  var other_ul = document.getElementById("character-other");
  other_ul.innerHTML = `
    <li>Level: ` + lvl_info.lvl + ` (` + char.points + `)</li>
    <li>Progress: ` + lvl_info.progress + `%</li>
    <li>Respect: ` + char.respect + `</li>
    <li>LVL Lock: [` + char.xplock + `]</li>
    <li>Weight: ` + char.kg + ` kg</li>
  `;

};

CLIENT.UI.prototype.levelStat = function (e) {
  var stat = e.currentTarget.dataset.stat;
  ajax.post("level-stat", { stat: stat }, function (res) {
    if (res.status) {
      CLIENT.user.updateCharacter(CLIENT.ui.updateCharacterUI);
    } else {
      var dlg = new Dialog(res.msg, [{name: "OK"}]);
      dlg.show();
    }
  });
};

CLIENT.UI.prototype.updateChallengesUI = function (received_new) {
  var ul = document.getElementById("challenge-list");
  ul.innerHTML = "";
  ul.style.display = this.open_top_menu == this.challenges_span ? "block" : "none";

  if (received_new) this.challenges_span.classList.add("active");

  function addClickHandlerReceived (li, ch, i) {
    li.onclick = function () {
      var text = ch.name + "<br/>" + "L: " + SHARED.getLvlInfo(ch.lvl).lvl + " R: " + ch.respect;
      var dlg = new Dialog(text, [
        { name: "Accept",
          callback: function () {
            CLIENT.emit('challenge-response', { ch_id: ch.id, response: true });
            CLIENT.challenges = [];
            CLIENT.ui.updateChallengesUI();
          },
        }, {
          name: "Decline",
          callback: function () {
            CLIENT.emit('challenge-response', { ch_id: ch.id, response: false });
            CLIENT.challenges.splice(i, 1);
            CLIENT.ui.updateChallengesUI();
          }
        }
      ]);
      dlg.show();
    };
  }

  function addClickHandlerSent (li, ch, i) {
    li.onclick = function () {
      var text = ch.name + "<br/>" + "L: " + SHARED.getLvlInfo(ch.lvl).lvl + " R: " + ch.respect;
      var dlg = new Dialog(text, [
        { name: "Withdraw",
          callback: function () {
            CLIENT.emit('challenge-withdraw', { ch_id: ch.id });
          },
        }, {
          name: "Close",
          callback: function () {}
        }
      ]);
      dlg.show();
    };
  }

  var div = document.createElement("div");
  div.innerHTML = "Received challenges (" + Object.keys(CLIENT.received_challenges).length + ")";
  ul.appendChild(div);
  for (var i in CLIENT.received_challenges) {
    var ch = CLIENT.received_challenges[i];
    var li = document.createElement("li");
    li.textContent = ch.name;
    addClickHandlerReceived(li, ch, i);
    ul.appendChild(li);
  }


  var div = document.createElement("div");
  div.innerHTML = "Sent challenges (" + Object.keys(CLIENT.sent_challenges).length + ")";
  ul.appendChild(div);
  for (var i in CLIENT.sent_challenges) {
    var ch = CLIENT.sent_challenges[i];
    var li = document.createElement("li");
    li.textContent = ch.name;
    addClickHandlerSent(li, ch, i);
    ul.appendChild(li);
  }

};

CLIENT.UI.prototype.login = function () {
  var username = document.getElementById("auth-user").value;
  var password = document.getElementById("auth-pass").value;

  if (username.replace(/ /g, '') == "" || password.replace(/ /g, '') == "") {
    return;
  } else {
    password = md5(password);
    ajax.post('login', {
      username: username,
      password: password,
      socket_id: CLIENT.socket.id,
    }, function (response) {
      if (response.status) {
        Cookies.set('token', response.token, { expires: 30 });
        CLIENT.user = new CLIENT.User(response.user);
        CLIENT.ui.screen("town");
      } else {
        var dlg = new Dialog("Account details incorrect", [{name: "Retry"}]);
        dlg.show();
      }
    });
  }
};

CLIENT.UI.prototype.register = function () {
  var username = document.getElementById("auth-user").value;
  var password = document.getElementById("auth-pass").value;

  if (username.replace(/ /g, '') == "" || password.replace(/ /g, '') == "") {
    return;
  } else {
    password = md5(password);
    ajax.post('register', {
      username: username,
      password: password,
    }, function (response) {
      if (response.status) {
        var dlg = new Dialog("Registered successfully. You can now log in.", [{name: "OK"}]);
        dlg.show();
      } else {
        var dlg = new Dialog(response.msg, [{name: "Retry"}]);
        dlg.show();
      }
    });
  }
};

CLIENT.UI.prototype.strings = {
  arenaHeader: "Challenge other players to fight in the arena.",
  arenaEmpty: "It's probably feast time since nobody is looking for a challenge at the moment. Try again later.",
  charHeader: "Choose which skills, spells and equipment you want to use during fights in the arena.",
  weaponHeader: "Weapons",
  bowHeader: "Bows",
  armorHeader: "Armors",
  bombHeader: "Bombs",
  trapHeader: "Traps",
  movementHeader: "Movement skills",
  meleeHeader: "Close combat skills",
  rangeHeader: "Ranged combat skills",
  defenseHeader: "Defensive skills",
  spectralHeader: "Spectral spells",
  baneHeader: "Bane spells",
  guardianHeader: "Guardian spells",
  spiritHeader: "Spirit spells",

};
