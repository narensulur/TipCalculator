'use strict';

var oAuthForDevices;
var background = {};
var isInit = true;

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
                alert("Success!");
                if (params.tokenResponse) {
                  alert("Got Token Response");
                  if (params.error) {
                    alert("Access token error: " + params.error + " try signing out and into your Google Account or try again later!");
                  } else {
                    // console.debug(params.tokenResponse);
                    background.getCustomers();
                  }
                  background.getCustomers();
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
              // logError(error);
              alert(error);
            }
          } else if (tab.title.match(/denied/i)) {
            chrome.tabs.remove(tabId);
          } else {
            // logError(tab.title);
            alert("error " + tab.title + " please try again or try later!");
          }
        }
    }
  });

  chrome[runtimeOrExtension].onMessage.addListener(function(request, sender, opt_callback) {
    switch(request.method) {
      case "contacts.get": 
        google.getContacts();
      break;
      case "authtoken.refresh":
        google.refresh(); 
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
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    chrome.storage.local.get('contacts', function(item) {
      chrome.tabs.sendMessage(activeTab.id, {"message": item.contacts });
    });
  });
};

background.version = function() {
  if(chrome.app) {
    window.localStorage['qbo_cal_version'] = chrome.app.getDetails().version;
  }
};

background.checkInstall = function() {
  if(!isInit) {
    return;
  }
  if(!window.localStorage['qbo_cal_installed']) {
    isInit = false;
    $.ajax({
      type: "GET",
      url: "https://connector.appconnect.intuit.com/intuit/api/google-extension-install.json?token=k3thk1cdn8l212g",
      timeout: 45000,
      complete: function(jqXHR, textStatus) {
        var status = getStatus(jqXHR, textStatus);
        if (status == 200 || status == 204) {
          window.localStorage['qbo_cal_installed'] = true;
        }
      }
    });
  }
};

background.init = function() {
  background.checkInstall();
  background.listen();
  background.version();
};

$(document).ready(function() {
  background.init();
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
  if (tab.url !== undefined && info.status == "complete" && tab.url.indexOf("https://calendar.google.com/calendar/render") > -1) {
    background.getCustomers();
  }
});
