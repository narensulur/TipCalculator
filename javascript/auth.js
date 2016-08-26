var google = {};
var oAuthForDevices = new OAuthForDevices();

google.refresh = function() {
  oAuthForDevices.refresh();
};

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

