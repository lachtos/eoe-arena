ajax = {
  timestamp: function () {
    return '' + new Date().getTime();
  },

  get: function (url, callback) {
    var oReq = new XMLHttpRequest();
    oReq.onreadystatechange = function () {
      if (oReq.readyState == 4 && oReq.status == 200) {
        if (oReq.response.status == -1) {
          CLIENT.authFailure();
        } else {
          callback(oReq.response);
        }
      }
    }
    oReq.open('GET', url + '&' + this.timestamp(), true);
    oReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    oReq.responseType = 'json';
    oReq.send();
  },

  post: function (action, obj, callback) {
    obj.ajax_action = action;
    var oReq = new XMLHttpRequest();
    oReq.onreadystatechange = function () {
      if (oReq.readyState == 4 && oReq.status == 200) {
        if (oReq.response.status == -1) {
          CLIENT.authFailure();
        } else {
          callback(oReq.response);
        }
      }
    }
    oReq.open('POST', '/ajax' + '?' + this.timestamp(), true);
    oReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    oReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    oReq.responseType = 'json';
    oReq.send(JSON.stringify(obj));
  },
};
