$(function() {
  $('#auth').on('click', function() {
    chrome.extension.sendMessage({method: 'authtoken.get'});
  });
  $('#clear').on('click', function() {
    chrome.extension.sendMessage({method: 'authtoken.clear'});
  });
});