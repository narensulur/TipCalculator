/**
 * Copyright (c) 2013 The Chromium Authors. All rights reserved.  Use of this
 * source code is governed by a BSD-style license that can be found in the
 * LICENSE file.
 */

var $ = document.getElementById.bind(document);

$('name').textContent = chrome.i18n.getMessage('name');
// $('link').href = url;
$('remove').onclick = function() {
  // chrome.management.uninstallSelf({showConfirmDialog: true});
  window.close();
};
