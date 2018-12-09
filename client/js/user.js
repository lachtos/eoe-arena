CLIENT.User = function (data) {
  this.id = data.id;
  this.character = data.character;
  this.updateTitle();
};

CLIENT.User.prototype.updateCharacter = function (callback) {
  // request character info from server
  var scope = this;
  ajax.post("get-character", {}, function (char) {
    scope.character = char;
    scope.updateTitle();
    if (typeof callback === 'function') {
      callback();
    }
  });
};

CLIENT.User.prototype.updateTitle = function () {
  var title = this.character.name;
  if (this.character.points > 0) title += " (" + this.character.points + ")";
  document.getElementById("character-span").textContent = title;
};

CLIENT.User.prototype.getXP = function () {

};
