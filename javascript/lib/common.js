function OAuthForDevices(tokenResponse) {
  
  var GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/auth";
  var GOOGLE_TOKEN_URL = "https://accounts.google.com/o/oauth2/token";
  var GOOGLE_CLIENT_ID = "976988315458-5bq5ri9nq0aq5bcvbl7nlkbnuir8pkps.apps.googleusercontent.com";
  var GOOGLE_CLIENT_SECRET = "vDzGjgWbX6F8Gji4u88qe3-C";
  var GOOGLE_REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";
  var GOOGLE_SCOPE = "https://www.google.com/m8/feeds/";
  
  var BASE_URI = "https://www.google.com/m8/feeds/contacts/default/full";

  var STATE = "QuickbooksCalendar"; // roundtrip param use to identify correct code response window (because both gmail and calendar other extensions might popup this window also
  
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
    // var token = onTokenChangeWrapper(this.tokenResponse);
    if(this.tokenResponse != null) {
      onTokenChangeWrapper({tokenResponse: this.tokenResponse});
      ensureToken(this.tokenResponse, this.contactsApi);
    }
  }

  this.contactsApi = function() {
    if(!that.tokenResponse) {
      return;
    }
    sendOAuthRequest({tokenResponse: that.tokenResponse, url: "/"}, function(params) {     
      if (params.error) {
        console.error("failed, need token refresh");
      } else {
        $xml = $(params.data);
        var feed = $xml[0].childNodes[0];
        var entries = $(feed).find( "entry" );
        console.debug(entries);
        console.debug(entries.length);
        var customers = [];
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          var title = $(entry).find("title")[0].textContent;
          customers.push(title);
        }
        window.localStorage['contacts'] = JSON.stringify(customers);
        // callback(params);
      }
    });
  }

  function onTokenChangeWrapper(params) {
    // expires_in params is in seconds (i think)
    params.tokenResponse.expiryDate = new Date(Date.now() + (params.tokenResponse.expires_in * 1000));
    that.onTokenChange(params, that.tokenResponse);
  } 

  function onTokenErrorWrapper(tokenResponse, response) {
    // 400 is returned when refresing token and 401 when .send returns... // means user has problably revoked access: statusText = Unauthorized message = Invalid Credentials
    if ((response.oauthAction == "refreshToken" && response.jqXHR.status == 400) || response.jqXHR.status == 401) {
      console.error("user probably revoked access so removing token:", response);
      that.removeTokenResponse(tokenResponse);      
      // that.onTokenError(tokenResponse, response);
    }
  } 

  // setup default functions...
  // params: changedToken, allTokens
  this.onTokenChange = function() {};
  this.onTokenError = function() {};
  
  this.openPermissionWindow = function(email) {
    return new Promise(function(resolve, reject) {
      // prompt=select_account&
      var url = GOOGLE_AUTH_URL + "?response_type=code&client_id=" + GOOGLE_CLIENT_ID + "&redirect_uri=" + GOOGLE_REDIRECT_URI + "&scope=" + encodeURIComponent(GOOGLE_SCOPE) + "&state=" + STATE;
      if (email) {
        url += "&login_hint=" + encodeURIComponent(email);
      } else {
        url += "&prompt=select_account"; // does work :)
      }
      
      var width = 900;
      var height = 700;
      var left = Math.round( (screen.width/2)-(width/2) );
      var top = Math.round( (screen.height/2)-(height/2) );
      
      chrome.windows.create({url:url, width:width, height:height, left:left, top:top, type:"popup"}, function(newWindow) {
        resolve(newWindow);
      });
    });
  }
  
  
  this.setOnTokenChange = function(onTokenChange) {
    this.onTokenChange = onTokenChange;
  }

  this.setOnTokenError = function(onTokenError) {
    this.onTokenError = onTokenError;
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
    if (isExpired(tokenResponse)) {
      console.log("token expired: ", tokenResponse);
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
    // must refresh token
    // console.log("refresh token: " + tokenResponse.userEmail + " " + now().toString());
    $.ajax({
      type: "POST",
      url: GOOGLE_TOKEN_URL,      
      data: {refresh_token:tokenResponse.refresh_token, client_id:GOOGLE_CLIENT_ID, client_secret:GOOGLE_CLIENT_SECRET, grant_type:"refresh_token"},
      dataType: "json",
      timeout: 5000,
      complete: function(jqXHR, textStatus) {
        if (textStatus == "success") {
          var refreshTokenResponse = JSON.parse(jqXHR.responseText);
          tokenResponse.access_token = refreshTokenResponse.access_token;
          tokenResponse.expires_in = refreshTokenResponse.expires_in;
          tokenResponse.token_type = refreshTokenResponse.token_type;         
          
          var callbackParams = {tokenResponse:tokenResponse};
          onTokenChangeWrapper(callbackParams);
          console.debug(tokenResponse);
          that.saveToken(tokenResponse);
          console.log("expires at: " + tokenResponse.expiryDate.toString());
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
          logError(callbackParams.error);
          callback(callbackParams);
        }
      }
    });
  }
  
  // private isExpired
  function isExpired(tokenResponse) {
    console.debug(tokenResponse);
    var SECONDS_BUFFER = -300; // 5 min. yes negative, let's make the expiry date shorter to be safe
    return !tokenResponse.expiryDate || new Date().isAfter(tokenResponse.expiryDate.addSeconds(SECONDS_BUFFER, true));
  }

  this.send = function(params, callback) {
    var dfd = new $.Deferred();
    // save all args in this sendrequet to call it back later
    that.params = params;
    if (!callback) {
      callback = function() {};
    }
    that.callback = callback;
    
    var tokenResponse = that.findTokenResponse(params);   
    if (tokenResponse) {
      ensureToken(tokenResponse, function(response) {
        if (response.error) {
          onTokenErrorWrapper(tokenResponse, response);           
          response.roundtripArg = params.roundtripArg;            
          callback(response);
          dfd.resolve(response);            
        } else {
          sendOAuthRequest(params, function(response) {
            if (response.error) {
              onTokenErrorWrapper(tokenResponse, response);
            }
            response.roundtripArg = params.roundtripArg;
            callback(response);
            dfd.resolve(response);            
          });
        }
      });     
    } else {
      var error = "no token response found for email: " + params.userEmail;
      console.warn(error, params);
      params.error = error;
      that.callback(params);
      dfd.resolve(params);
    }
    return dfd.promise();
  }
  
  this.saveToken = function(tokenResponse) {
    that.tokenResponse = tokenResponse;
    window.localStorage['token'] = JSON.stringify(tokenResponse);
  };

  this.loadToken = function() {
    var token = window.localStorage['token'];
    if(token) {
      that.tokenResponse = JSON.parse(token);
    }
    return that.tokenResponse;
  };
  
  this.clearToken = function() {
    console.debug('CLEARED');
    window.localStorage.removeItem('contacts');
    window.localStorage.removeItem('token');
    that.tokenResponse = null;
    that.onTokenChange(null, that.tokenResponse);
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

            that.saveToken(tokenResponse);
            
            that.contactsApi();

            var callbackParams = {tokenResponse:tokenResponse};
            onTokenChangeWrapper(callbackParams);
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


