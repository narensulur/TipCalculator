var google = {};

// google.auth = new OAuth2('google', {
//   client_id: '976988315458-513pacglki5rsounlfsrmugsbr6cvdd6.apps.googleusercontent.com',
//   client_secret: 'SHNp6y2D_dFYXcKu9L4ubWeE',
//   api_scope: 'https://www.google.com/m8/feeds/'
// });

google.clearToken = function() {
  google.auth.clearAccessToken();
};

google.requestAuth = function() {
  var oAuth = new OAuthForDevices([]);
  oAuth.openPermissionWindow().then(function(permissionWindow) {
    window.permissionWindow = permissionWindow;
  });
//   google.auth.authorize(function() {
//     var accessToken = google.auth.getAccessToken();
//     if(!accessToken) {
//       return false;
//     }
//     background.updateBadge({
//       'text': ""
//     });
//     // background.log('getAuthToken', chrome.runtime.lastError.message);
//     return;
//   });
};

google.getContacts = function(token, callback, err) {
  console.debug('get contacts');

  var req = new XMLHttpRequest();
  req.open("GET", "https://www.google.com/m8/feeds/contacts/primary/full/");
  req.setRequestHeader('Authorization', 'Bearer ' + token);
  req.setRequestHeader('GData-Version', '3.0');
  req.addEventListener('readystatechange', function(event) {
    if (req.readyState == 4) {
      if (req.status == 200) {
        console.debug(req.responseText);
        if(typeof(callback) === "function") {
          callback();
        }
      } else {
        console.error("ERROR GETTING CONTACTS");
        // if(typeof(err) === "function") {
        //   err();
        // }
      }
    }
  });
  req.send();
  
  // if(!google.auth.hasAccessToken()) { 
  //   return false;
  // }

  // google.auth.authorize(function() {
    // var accessToken = google.auth.getAccessToken();
    // if(accessToken) {
      // console.debug('access token found');
      // req.open("GET", "https://connector.appconnect.intuit.com/duzz/api/googlecontacts-get-contacts.json?token=66iwn301jye2g3h", true);
      // // req.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      // req.addEventListener('readystatechange', function(event) {
      //   if (req.readyState == 4) {
      //     if (req.status == 200) {
      //       if(typeof(callback) === "function") {
      //         callback();
      //       }
      //     } else {
      //       if(typeof(err) === "function") {
      //         err();
      //       }
      //     }
      //   }
      // });
      // req.send();
    // } else {
    //   console.debug('No token found');
    // }
  // });
};

// var apiKey = "AIzaSyC0nhbN3R-7-ppZRZoq_Wvcmr7dn2HA1no";

// if(typeof(OAuth2) !== "undefined") {
//   google = new OAuth2('google', {
//     client_id: '976988315458-513pacglki5rsounlfsrmugsbr6cvdd6.apps.googleusercontent.com',
//     client_secret: 'SHNp6y2D_dFYXcKu9L4ubWeE',
//     api_scope: 'https://www.google.com/m8/feeds/'
//     // api_scope: 'https://www.googleapis.com/auth/contacts'
//   });
// }

// function api(callback, errorCallback) {
//   google.authorize(function() {
//     var req = new XMLHttpRequest();
//       req.open(
//               "GET",
//               "https://people.googleapis.com/v1/people/me/connections?key=" + apiKey, true);
//       req.setRequestHeader('Authorization', 'Bearer ' + google.getAccessToken());
//       // req.setRequestHeader("Referer", "http://www.google.com/robots.txt");
//       // req.onload = onResponseReceived;
//       req.addEventListener('readystatechange', function(event) {
//         console.debug(req.status);
//         if (req.readyState == 4) {
//           if (req.status == 200) {
//             // Callback with the data (incl. tokens).
//             // console.debug(req.responseText);
//             if(callback) {
//               callback(req.responseText);
//             }
//             // onResponseReceived(that.adapter.parseAccessToken(req.responseText));
//           } else {
//             if(errorCallback) {
//               errorCallback();
//             }
//           }
//         }
//       });
//       req.send();
//     });
// }

//   function authorize(providerName) {
//     var provider = window[providerName];
//     provider.authorize(checkAuthorized);
//   }

//   function clearAuthorized() {
//     console.log('clear');
//     ['google'].forEach(function(providerName) {
//       var provider = window[providerName];
//       provider.clearAccessToken();
//     });
//     checkAuthorized();
//   }

//   function checkAuthorized() {
//     console.log('checkAuthorized');
//     ['google'].forEach(function(providerName) {
//       var provider = window[providerName];
//       var button = document.querySelector('#' + providerName);
//       if (provider.hasAccessToken()) {
//         console.debug('has Google access');
//         api();
//         button.classList.add('authorized');
//       } else {
//         button.classList.remove('authorized');
//       }
//     });
//   }

// document.addEventListener('DOMContentLoaded', function () {

//   document.querySelector('button#google').addEventListener('click', function() { authorize('google'); });
//   document.querySelector('button#clear').addEventListener('click', function() { clearAuthorized() });

//   checkAuthorized();
// });