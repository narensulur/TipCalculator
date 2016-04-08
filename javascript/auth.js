var google = {};
var oAuthForDevices = new OAuthForDevices();

google.clearToken = function() {
  oAuthForDevices.clearToken();
};

google.requestAuth = function() {

  var token = oAuthForDevices.loadToken();
  console.debug(token);

  if(token !== null) {
    oAuthForDevices.getContacts();
    return;
  }

  oAuthForDevices.openPermissionWindow().then(function(permissionWindow) {
    window.permissionWindow = permissionWindow;
  });
};

google.getContacts = function(token, callback, err) {
  console.debug('get contacts');
  oAuthForDevices.getContacts();
};

