var google = {};
var oAuthForDevices = new OAuthForDevices();

google.clearToken = function() {
  oAuthForDevices.clearToken();
};

google.requestAuth = function() {

  var token = oAuthForDevices.loadToken();
  
  if(token !== null) {
    oAuthForDevices.getContacts();
    return;
  }

  oAuthForDevices.openPermissionWindow().then(function(permissionWindow) {
    window.permissionWindow = permissionWindow;
  });
};

google.getContacts = function() {
  console.debug('get contacts');
  oAuthForDevices.getContacts();
};

