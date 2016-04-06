/**
 * Copyright (c) 2013 The Chromium Authors. All rights reserved.  Use of this
 * source code is governed by a BSD-style license that can be found in the
 * LICENSE file.
 */

'use strict';

if (!self.port && !window.chrome && !window.safari) {
    throw new Error('Shouldn\'t be here');
}

var getJSON = false;

chrome.tabs.executeScript({
  file: 'javascript/cal.js'
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
  if (tab.url !== undefined && info.status == "complete" && getJSON === false && tab.url.indexOf("https://calendar.google.com/calendar/render") > -1) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var activeTab = tabs[0];
      getJSON = true;
      console.debug(tab.url);
      api(function(response) {
        chrome.tabs.sendMessage(activeTab.id, {"message": response});
      }, function() { // fail, retry
        getJSON = false;
      });
    });
  }
});