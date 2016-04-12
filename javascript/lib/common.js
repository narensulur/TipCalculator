function OAuthForDevices(tokenResponse) {
  
  var GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/auth";
  var GOOGLE_TOKEN_URL = "https://accounts.google.com/o/oauth2/token";
  var GOOGLE_CLIENT_ID = "976988315458-5bq5ri9nq0aq5bcvbl7nlkbnuir8pkps.apps.googleusercontent.com";
  var GOOGLE_CLIENT_SECRET = "vDzGjgWbX6F8Gji4u88qe3-C";
  var GOOGLE_REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";
  var GOOGLE_SCOPE = "https://www.google.com/m8/feeds/";
  
  var BASE_URI = "https://www.google.com/m8/feeds/contacts/default/full";

  var STATE = "QuickbooksCalendar"; // roundtrip param use to identify correct code response window
  
  // Need this because 'this' keyword will be out of scope within this.blah methods like callbacks etc.
  var that = this;
  
  this.tokenResponse = null;
  if (tokenResponse) {
    this.tokenResponse = tokenResponse;
  }
  this.params = null;
  this.callback = null;

  this.getStateParam = function() {
    return STATE;
  }

  this.getContacts = function() {
    if(this.tokenResponse != null) {
      ensureToken(this.tokenResponse, this.contactsApi);
    }
  }

  this.contactsApi = function() {
    if(!that.tokenResponse) {
      return;
    }
    chrome.extension.sendMessage({method: 'authtoken.success'});
    sendOAuthRequest({tokenResponse: that.tokenResponse, url: "/"}, function(params) {     
      if (params.error) {
        console.error("failed, need token refresh");
      } else {
        $xml = $(params.data);
        var feed = $xml[0].childNodes[0];
        var entries = $(feed).find( "entry" );
        var customers = [];
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          var title = $(entry).find("title")[0].textContent;
          customers.push(title);
        }
        chrome.storage.local.set({'contacts': JSON.stringify(customers)});
      }
    });
  }

  function setExpireDate() {
    that.tokenResponse.expiryDate = new Date(Date.now() + (that.tokenResponse.expires_in * 1000));
  } 
  
  this.openPermissionWindow = function() {
    return new Promise(function(resolve, reject) {
      
      var url = GOOGLE_AUTH_URL + "?response_type=code&client_id=" + GOOGLE_CLIENT_ID + "&redirect_uri=" + GOOGLE_REDIRECT_URI + "&scope=" + encodeURIComponent(GOOGLE_SCOPE) + "&state=" + STATE + "&prompt=select_account";
      
      var width = 900;
      var height = 700;
      var left = Math.round( (screen.width/2)-(width/2) );
      var top = Math.round( (screen.height/2)-(height/2) );
      
      chrome.windows.create({url:url, width:width, height:height, left:left, top:top, type:"popup"}, function(newWindow) {
        resolve(newWindow);
      });

    });
  }
  
  
  function sendOAuthRequest(params, callback) {
    // must append the access token to every request
    
    if (!params.type) {
      params.type = "GET";
    }
    
    var accessToken;
    if (params.tokenResponse) {
      accessToken = params.tokenResponse.access_token;
    }

    params.url = setUrlParam(params.url, "access_token", accessToken);

    // if no data then add empty structure    
    if (params.type == "DELETE") {
      params.data = null;
    } else {
      //if (!params.data) {
        //params.data = {};
      //}

      //params.data.access_token = accessToken;
    }
    
    if (params.processData == undefined) {
      params.processData = true;
    }
    
    $.ajax({
      type: params.type,
      url: BASE_URI + params.url,
      data: params.data,
      headers: {"GData-Version": "3.0"},
      contentType: params.contentType,
      processData: params.processData,
      dataType: "xml",
      timeout: 45000,
      complete: function(jqXHR, textStatus) {
        var status = getStatus(jqXHR, textStatus);
        if (status == 200 || status == 204) {
          var data;
          if (jqXHR.responseText) {
            data = $.parseXML(jqXHR.responseText);
          } else {
            // happens when user does a method like DELETE where this no content returned
            data = {};
          }
          // chrome.extension.sendMessage({method: 'authtoken.success'});
          callback({data:data});
        } else {
          console.error("error getting data", jqXHR);
          
          var dataCode;
          var dataError;
          try {
             var data = JSON.parse(jqXHR.responseText);
             dataCode = data.error.code;
             dataError = data.error.message; 
          } catch (e) {         
          }
          
          if (dataError) {
            params.error = textStatus + " " + dataCode + " - " + dataError;
          } else {
            params.error = textStatus;
          }
          
          params.jqXHR = jqXHR;
          params.textStatus = textStatus;
          callback(params);
        }
      }
    });
  }
  
  function ensureToken(tokenResponse, callback) {
    console.log(tokenResponse);
    if (isExpired(tokenResponse)) {
      refreshToken(tokenResponse, function(response) {
        if(typeof(callback) != "undefined") {
          callback(response);
        }
      });
    } else {
      if(typeof(callback) != "undefined") {
        callback({});
      }
    }
  }
  
  function refreshToken(tokenResponse, callback) {
    if(!tokenResponse.refresh_token) {
      console.error('no refresh token');
      console.debug(tokenResponse);
      return;
    }
    console.log('refresh token');
    console.log(tokenResponse);
    $.ajax({
      type: "POST",
      url: GOOGLE_TOKEN_URL,      
      data: {refresh_token:tokenResponse.refresh_token, client_id:GOOGLE_CLIENT_ID, client_secret:GOOGLE_CLIENT_SECRET, grant_type:"refresh_token"},
      dataType: "json",
      timeout: 5000,
      complete: function(jqXHR, textStatus) {
        if (textStatus == "success") {
          that.tokenResponse = {};
          var refreshTokenResponse = JSON.parse(jqXHR.responseText);
          that.tokenResponse.access_token = refreshTokenResponse.access_token;
          that.tokenResponse.expires_in = refreshTokenResponse.expires_in;
          that.tokenResponse.token_type = refreshTokenResponse.token_type;         
          // that.tokenResponse.expiryDate = new Date(Date.now() + (that.tokenResponse.expires_in * 1000));

          setExpireDate();
          that.saveToken();

          console.log(that.tokenResponse.expiryDate.toString());
          callback(callbackParams);

        } else {
          var callbackParams = {tokenResponse:tokenResponse};
          
          var responseError;
          try {
            var bodyResponse = JSON.parse(jqXHR.responseText);
            responseError = bodyResponse.error;
          } catch (e) {
            responseError = jqXHR.statusText;
          }
          
          callbackParams.code = jqXHR.status;
          
          if (responseError == "invalid_grant") { // code = 400
            callbackParams.error = "You need to re-grant access, it was probably revoked";
          } else {
            callbackParams.error = "error getting new token via refresh token: " + responseError;
          }
          
          callbackParams.jqXHR = jqXHR;
          callbackParams.oauthAction = "refreshToken";
          callback(callbackParams);
        }
      }
    });
  }
  
  // private isExpired
  function isExpired(tokenResponse) {
    var SECONDS_BUFFER = -300; // 5 min
    return !tokenResponse.expiryDate || new Date().isAfter(new Date(tokenResponse.expiryDate).addSeconds(SECONDS_BUFFER, true));
  }
  
  this.saveToken = function() {
    // that.tokenResponse = tokenResponse;
    // window.localStorage['token'] = JSON.stringify(tokenResponse);
    chrome.storage.local.set({'token': JSON.stringify(that.tokenResponse)});
  };

  this.loadToken = function() {
    chrome.storage.local.get('token', function(item) {
      console.debug('got token');
      console.debug(item.token);
      if(item.token) {
        that.tokenResponse = JSON.parse(item.token);
        that.getContacts();
      } else {
        that.openPermissionWindow();
      }

    });
  };
  
  this.clearToken = function() {
    console.debug('CLEARED');
    chrome.storage.local.remove('contacts');
    chrome.storage.local.remove('token');
    that.tokenResponse = null;
    // that.onTokenChange(null, that.tokenResponse);
  };

  this.getAccessToken = function(code, callback) {
    if (!code) {
      //alert("authorization code param is required: comes from opening the google grant permission popup");
    }
    that.code = code;
    
    $.ajax({
      type: "POST",
      url: GOOGLE_TOKEN_URL,
      data: {code:code, client_id:GOOGLE_CLIENT_ID, client_secret:GOOGLE_CLIENT_SECRET, redirect_uri:GOOGLE_REDIRECT_URI, grant_type:"authorization_code"},
      dataType: "json",
      timeout: 5000,
      complete: function(request, textStatus) {
        if (textStatus == "success") {
          var tokenResponse = JSON.parse(request.responseText);

          // console.debug(tokenResponse);
          if (tokenResponse.error) {
            callback({error:tokenResponse.error.message});
          } else {
            
            that.tokenResponse = tokenResponse;

            setExpireDate();

            that.saveToken();

            that.contactsApi();

          }
        } else {
          callback({error:textStatus});
        }
      }
    });
  } 
}


function getStatus(request, textStatus) {
  var status; // status/textStatus combos are: 201/success, 401/error, undefined/timeout
  try {
    status = request.status;
  } catch (e) {
    status = textStatus;
  }
  return status;
}

function setUrlParam(url, param, value) {
  var params = url.split("&");
  for (var a=0; a<params.length; a++) {
    var idx = params[a].indexOf(param + "=");
    if (idx != -1) {
      var currentValue = params[a].substring(idx + param.length + 1);
      return url.replace(param + "=" + currentValue, param + "=" + value);
    }
  }
  
  // if there is a hash tag only parse the part before;
  var urlParts = url.split("#");
  var newUrl = urlParts[0];
  
  if (newUrl.indexOf("?") == -1) {
    newUrl += "?";
  } else {
    newUrl += "&";
  }
  
  newUrl += param + "=" + value;
  
  // we can not append the original hashtag (if there was one)
  if (urlParts.length >= 2) {
    newUrl += "#" + urlParts[1];
  }
  
  return newUrl;
}


