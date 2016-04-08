
$(function() {

  if(localStorage.token) {
    $('.auth').hide();
    $('#get').show();
  }

  $('#auth').on('click', function() {
    chrome.extension.sendMessage({method: 'authtoken.get'});
  });
  $('#get').on('click', function() {
    chrome.extension.sendMessage({method: 'authtoken.get'});
  });
  $('#clear').on('click', function() {
    chrome.extension.sendMessage({method: 'authtoken.clear'});
  });

  chrome.extension.onMessage.addListener(function(request, sender, opt_callback) {
    switch(request.method) {
      case "authtoken.clear": 
        $('.auth').show();
        $('#get').hide();
      break;
      case "authtoken.success": 
        $('.auth').hide();
        $('#get').show();
      break;
    }
  });

});