

  Dialog = function (content, options) {
    // content = html content to show in the dialog
    // options = options and their callbacks [{name: option_name, callback: option_cb}]
    this.dialog = CLIENT.dialog;
    this.overlay = document.getElementById("dialog-overlay");
    var scope = this;
    dialog.style.top = "50%";
    dialog.querySelector(".content").innerHTML = content;
    var optionsDOM = dialog.querySelector(".options");
    optionsDOM.innerHTML = "";

    function addOnClick(opt, j) {
      opt.onclick = function () {
        scope.hide();
        if (options[j].hasOwnProperty('callback') && typeof options[j].callback === 'function')
          options[j].callback();
      };
    };

    for (var i = 0; i < options.length; ++i) {
      var opt = document.createElement("span");
      opt.innerHTML = options[i].name;
      addOnClick(opt, i);
      optionsDOM.appendChild(opt);
    }
  };

  Dialog.prototype.show = function () {
    this.overlay.style.display = "block";
  };

  Dialog.prototype.hide = function () {
    this.overlay.style.display = "none";
  };

  Dialog.prototype.setTop = function (top) {
    this.dialog.style.top = top;
  };
