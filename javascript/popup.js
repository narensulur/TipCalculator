
$(function() {

  chrome.storage.local.get('token', function(item) {
    if(item.token) {
      $('.auth').hide();
      $('#get').show();
    }
  });

  $('#auth').on('click', function() {
    chrome[runtimeOrExtension].sendMessage({method: 'authtoken.get'});
  });
  $('#refresh').on('click', function() {
    chrome[runtimeOrExtension].sendMessage({method: 'authtoken.refresh'});
    $('#loader').show();
    $('.refresh').hide();
    $(this).hide();
  });
  $('#clear').on('click', function() {
    chrome[runtimeOrExtension].sendMessage({method: 'authtoken.clear'});
    $('.refresh').hide();
  });

  chrome[runtimeOrExtension].onMessage.addListener(function(request, sender, opt_callback) {
    switch(request.method) {
      case "authtoken.refresh": 
        setTimeout(function() {
          $('#loader').hide();
          $('.refresh').show();
          setTimeout(function() {
            $('#refreshSuccess').hide();
          }, 3000);
        }, 1000);
      break;
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