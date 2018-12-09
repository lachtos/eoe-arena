CLIENT.emit = function (name, object) {
  object.session_token = Cookies.get("token") || 0;
  CLIENT.socket.emit(name, object);
};
