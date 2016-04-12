var google = {};
var oAuthForDevices = new OAuthForDevices();

google.clearToken = function() {
  oAuthForDevices.clearToken();
};

google.requestAuth = function() {
  oAuthForDevices.loadToken();
};

google.getContacts = function() {
  // console.debug('get contacts');
  oAuthForDevices.loadToken();
};

