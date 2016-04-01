/**
 * Copyright (c) 2013 The Chromium Authors. All rights reserved.  Use of this
 * source code is governed by a BSD-style license that can be found in the
 * LICENSE file.
 */

'use strict';

if (!self.port && !window.chrome && !window.safari) {
    throw new Error('Shouldn\'t be here');
}




// var pb = {
//     'www': 'https://www.pushbullet.com',
//     'api': 'https://api.pushbullet.com',
//     'ws': 'wss://stream.pushbullet.com/websocket',
//     'stream': 'https://stream.pushbullet.com/streaming',
//     'andrelytics': 'https://zebra.pushbullet.com'
// };

// var getHeaders = function() {
//     return {
//         'X-User-Agent': pb.userAgent,
//         'Authorization': 'Bearer ' + pb.local.apiKey,
//         'Accept': 'application/json'
//     };
// };

// var onResponse = function(status, body, done) {
//     if (status == 200) {
//         try {
//             done(JSON.parse(body));
//         } catch (e) {
//             pb.log(e);
//             done();
//         }
//     } else if (status === 401) {
//         pb.signOut();
//     } else if (status === 400) {
//         try {
//             done(null, JSON.parse(body).error);
//         } catch (e) {
//             done();
//         }
//     } else {
//         done();
//     }
// };

// pb.get = function(url, done) {
//     pb.log('GET ' + url);

//     var xhr = new XMLHttpRequest();
//     xhr.open('GET', url, true);

//     xhr.timeout = 30000;
//     xhr.ontimeout = function() {
//         onResponse(0, null, done);
//     };

//     var headers = getHeaders();
//     Object.keys(headers).forEach(function(key) {
//         xhr.setRequestHeader(key, headers[key]);
//     });

//     xhr.onreadystatechange = function() {
//         if (xhr.readyState === 4) {
//             onResponse(xhr.status, xhr.responseText, done);
//         }
//     };

//     xhr.send();
// };

// pb.del = function(url, done) {
//     pb.log('DELETE ' + url);

//     var xhr = new XMLHttpRequest();
//     xhr.open('DELETE', url, true);

//     xhr.timeout = 30000;
//     xhr.ontimeout = function() {
//         onResponse(0, null, done);
//     };

//     var headers = getHeaders();
//     Object.keys(headers).forEach(function(key) {
//         xhr.setRequestHeader(key, headers[key]);
//     });

//     xhr.onreadystatechange = function() {
//         if (xhr.readyState === 4) {
//             onResponse(xhr.status, xhr.responseText, done);
//         }
//     };

//     xhr.send();
// };

// pb.post = function(url, object, done) {
//     pb.log('POST ' + url);

//     var xhr = new XMLHttpRequest();
//     xhr.open('POST', url, true);
//     xhr.setRequestHeader('Content-Type', 'application/json');

//     var headers = getHeaders();
//     Object.keys(headers).forEach(function(key) {
//         xhr.setRequestHeader(key, headers[key]);
//     });

//     xhr.onreadystatechange = function() {
//         if (xhr.readyState === 4) {
//             onResponse(xhr.status, xhr.responseText, done);
//         }
//     };

//     xhr.send(JSON.stringify(object));
// };

chrome.tabs.executeScript({
  file: 'javascript/cal.js'
});

// chrome.browserAction.onClicked.addListener(function(tab) {
//   // No tabs or host permissions needed!
//   console.log('Turning ' + tab.url + ' red!');
//   chrome.tabs.executeScript({
//     // code: 'document.body.style.backgroundColor="red"'
//     file: 'javascript/cal.js'
//   });
// });
