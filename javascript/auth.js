var google = {};
var oAuthForDevices = new OAuthForDevices();

google.clearToken = function() {
  oAuthForDevices.clearToken();
};

google.requestAuth = function() {

  oAuthForDevices.loadToken();
  // oAuthForDevices.loadToken(oAuthForDevices.getContacts, function() {
  //   oAuthForDevices.openPermissionWindow().then(function(permissionWindow) {
  //     window.permissionWindow = permissionWindow;
  //   });
  // });

};

google.getContacts = function() {
  console.debug('get contacts');
  oAuthForDevices.getContacts();
};

