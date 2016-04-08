'use strict';

var oAuthForDevices;
var background = {};

background.BADGE_COLORS = {
  ERROR: '#f00',
  IN_PROGRESS: '#efefef'
};

background.updateBadge = function(props) {
  if ('text' in props) {
    chrome.browserAction.setBadgeText({'text': props.text});
  }
  if ('color' in props) {
    chrome.browserAction.setBadgeBackgroundColor({'color': props.color});
  }
  if ('title' in props) {
    chrome.browserAction.setTitle({'title': props.title});
  }
};

background.refreshUI = function() {
  chrome.identity.getAuthToken({'interactive': false}, function (authToken) {
    if (chrome.runtime.lastError || !authToken) {
      background.updateBadge({
        'color': background.BADGE_COLORS.ERROR,
        'text': '?',
        'title': "Authorization Required"
      });
      return;
    }
  });
}

background.listen = function() {
  chrome.tabs.onUpdated.addListener(function onTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status == "complete") {
      // find code window and make sure its from this extension by matching the state
        if (tab.url.indexOf("https://accounts.google.com/o/oauth2/approval") != -1 && tab.title.indexOf("state=" + oAuthForDevices.getStateParam()) != -1) {
          if (tab.title.match(/success/i)) {
            var code = tab.title.match(/code=(.*)/i);
            if (code && code.length != 0) {
              code = code[1];
              chrome.tabs.remove(tabId);
              
              oAuthForDevices.getAccessToken(code, function(params) {
                if (params.tokenResponse) {
                  if (params.error) {
                    alert("Access token error: " + params.error + " try signing out and into your Google Calendar or try again later!");
                  } else {
                    console.debug(params.tokenResponse);
                  }
                  
                } else {
                  if (params.warning) {
                    // ignore: might by re-trying to fetch the userEmail for the non default account                  
                  } else {
                    alert("Error getting access token: " + params.error + " please try again or try later!");
                  }
                }
              });
            } else {
              var error = "error: code not found, please try again!";
              logError(error)
              alert(error);
            }
          } else if (tab.title.match(/denied/i)) {
            chrome.tabs.remove(tabId);
            // openUrl("http://jasonsavard.com/wiki/Granting_access?ref=permissionDenied&ext=calendar&state=" + encodeURIComponent(oAuthForDevices.getStateParam()) + "&title=" + encodeURIComponent(tab.title));
          } else {
            logError(tab.title);
            alert("error " + tab.title + " please try again or try later!");
          }
        }
    }
  });

  chrome.extension.onMessage.addListener(function(request, sender, opt_callback) {
    switch(request.method) {
      case "contacts.get": 
        google.getContacts();
      break;
      case "authtoken.get": 
        google.requestAuth();
      break;
      case "authtoken.clear": 
        google.clearToken();
      break;
    }
  });
};

background.getCustomers = function() {
  return window.localStorage['contacts'];
};

background.version = function() {
  window.localStorage['version'] = chrome.app.getDetails().version;
};

background.tokenSetup = function() {
  var tokenResponses = []; // TODO: setup localStorage for tokens
  oAuthForDevices = new OAuthForDevices(tokenResponses);
  oAuthForDevices.setOnTokenChange(function(params, allTokens) {
    tokenResponses = allTokens;
    // localStorage["tokenResponses"] = JSON.stringify(allTokens);
  });
  oAuthForDevices.setOnTokenError(function(tokenResponse, response) {
    // logout();
    alert('logout');
  });
};

background.init = function() {
  background.version();
  background.tokenSetup();
  // background.refreshUI();
  background.listen();
}

$(document).ready(function() {
  background.init();
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
  if (tab.url !== undefined && info.status == "complete" && tab.url.indexOf("https://calendar.google.com/calendar/render") > -1) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {"message": background.getCustomers() });
      // api(function(response) {
      //   chrome.tabs.sendMessage(activeTab.id, {"message": response});
      // }, function() { // fail, retry
      //   background.retry = true;
      // });
    });
  }
});