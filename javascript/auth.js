var google = {};

if(typeof(OAuth2) !== "undefined") {
  google = new OAuth2('google', {
    client_id: '976988315458-513pacglki5rsounlfsrmugsbr6cvdd6.apps.googleusercontent.com',
    client_secret: 'SHNp6y2D_dFYXcKu9L4ubWeE',
    api_scope: 'https://www.google.com/m8/feeds/'
    // api_scope: 'https://www.googleapis.com/auth/contacts'
  });
}

function api(callback) {
  google.authorize(function() {
    var req = new XMLHttpRequest();
      req.open(
              "GET",
              "https://people.googleapis.com/v1/people/me/connections", true);
      req.setRequestHeader('Authorization', 'Bearer ' + google.getAccessToken());
      // req.setRequestHeader("Referer", "http://www.google.com/robots.txt");
      // req.onload = onResponseReceived;
      req.addEventListener('readystatechange', function(event) {
        if (req.readyState == 4) {
          if (req.status == 200) {
            // Callback with the data (incl. tokens).
            // console.debug(req.responseText);
            if(callback) {
              callback(req.responseText);
            }
            // onResponseReceived(that.adapter.parseAccessToken(req.responseText));
          }
        }
      });
      req.send();

      function onResponseReceived(data, response) {
        console.debug("It worked.");
        console.debug(data);
        console.debug(response);
      }
    });
}

  function authorize(providerName) {
    var provider = window[providerName];
    provider.authorize(checkAuthorized);
  }

  function clearAuthorized() {
    console.log('clear');
    ['google'].forEach(function(providerName) {
      var provider = window[providerName];
      provider.clearAccessToken();
    });
    checkAuthorized();
  }

  function checkAuthorized() {
    console.log('checkAuthorized');
    ['google'].forEach(function(providerName) {
      var provider = window[providerName];
      var button = document.querySelector('#' + providerName);
      if (provider.hasAccessToken()) {
        console.debug('has Google access');
        api();
        button.classList.add('authorized');
      } else {
        button.classList.remove('authorized');
      }
    });
  }

document.addEventListener('DOMContentLoaded', function () {

  document.querySelector('button#google').addEventListener('click', function() { authorize('google'); });
  document.querySelector('button#clear').addEventListener('click', function() { clearAuthorized() });

  checkAuthorized();
});