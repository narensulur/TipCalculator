function OAuthForDevices(tokenResponses) {
  
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
  
  this.tokenResponses = tokenResponses;
  if (!this.tokenResponses) {
    this.tokenResponses = new Array();
  }
  this.params = null;
  this.callback = null;

  this.getStateParam = function() {
    return STATE;
  }

  // return array
  this.getUserEmails = function() {
    var userEmails = new Array();
    $.each(that.tokenResponses, function(index, tokenResponse) {
      userEmails.push(tokenResponse.userEmail);
    });
    return userEmails;
  }

  // return just the emailid
  this.getContacts = function(tokenResponse, callback) {
    // were using the contacts url because it's the only one we request permission to and it will give us the email id (so only fetch 1 result)
    // send token response since we don't have the userEmail
    sendOAuthRequest({tokenResponse:tokenResponse, url: "/"}, function(params) {     
      if (params.error) {
        console.error("failed: you might by re-trying to fetch the userEmail for the non default account")
        // params.warning = "failed: you might by re-trying to fetch the userEmail for the non default account";
        // callback(params);
      } else {
        console.debug(params);
        // var userEmail = params.data.id;
        // params.userEmail = userEmail;
        // callback(params);
      }
    });
  }

  function onTokenChangeWrapper(params) {
    // expires_in params is in seconds (i think)
    params.tokenResponse.expiryDate = new Date(Date.now() + (params.tokenResponse.expires_in * 1000));
    that.onTokenChange(params, that.tokenResponses);
  } 

  function onTokenErrorWrapper(tokenResponse, response) {
    // 400 is returned when refresing token and 401 when .send returns... // means user has problably revoked access: statusText = Unauthorized message = Invalid Credentials
    if ((response.oauthAction == "refreshToken" && response.jqXHR.status == 400) || response.jqXHR.status == 401) {
      console.error("user probably revoked access so removing token:", response);
      that.removeTokenResponse(tokenResponse);      
      that.onTokenError(tokenResponse, response);
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

  this.generateURL = function(userEmail, url, callback) {
    var tokenResponse = that.findTokenResponse({userEmail:userEmail});
    if (tokenResponse) {
      ensureToken(tokenResponse, function(response) {
        if (response.error) {
          console.error("error generating url", response);          
        } else {
          // before when calling refreshtoken we used to call this method, notice the tokenResponse came from the response and not that one passed in... params.generatedURL = setUrlParam(url, "access_token", params.tokenResponse.access_token);
          response.generatedURL = setUrlParam(url, "access_token", tokenResponse.access_token);
        }
        callback(response);
      });
    } else {
      callback({error:"No tokenResponse found!"});
    }
  }
  
  function sendOAuthRequest(params, callback) {
    // must append the access token to every request
    
    if (!params.type) {
      params.type = "GET";
    }
    
    var accessToken;
    if (params.tokenResponse) {
      accessToken = params.tokenResponse.access_token;
    } else if (params.userEmail) {
      var tokenResponse = that.findTokenResponse(params);
      accessToken = tokenResponse.access_token;
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
      contentType: params.contentType,
      processData: params.processData,
      dataType: "json",
      timeout: 45000,
      complete: function(jqXHR, textStatus) {
        var status = getStatus(jqXHR, textStatus);
        if (status == 200 || status == 204) {
          var data;
          if (jqXHR.responseText) {
            data = JSON.parse(jqXHR.responseText);
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
        callback(response);
      });
    } else {
      callback({});
    }
  }
  
  function refreshToken(tokenResponse, callback) {
    // must refresh token
    console.log("refresh token: " + tokenResponse.userEmail + " " + now().toString());
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
          console.log("in refresh: " + tokenResponse.expiryDate.toString());
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
    var SECONDS_BUFFER = -300; // 5 min. yes negative, let's make the expiry date shorter to be safe
    return !tokenResponse.expiryDate || new Date().isAfter(tokenResponse.expiryDate.addSeconds(SECONDS_BUFFER, true));
  }

  // public method, should be called before sending multiple asynchonous requests to .send
  this.ensureTokenForEmail = function(userEmail, callback) {
    var tokenResponse = that.findTokenResponse({userEmail:userEmail});
    if (tokenResponse) {
      ensureToken(tokenResponse, function(response) {
        callback(response);
      });
    } else {
      var error = "no token for: " + userEmail + ": might have not have been granted access";
      console.error(error);
      callback({error:error});
    }
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
  
  this.findTokenResponse = function(params) {
    for (var a=0; a<that.tokenResponses.length; a++) {
      if (that.tokenResponses[a].userEmail == params.userEmail) {
        return that.tokenResponses[a];
      }
    }
  }
  
  // removes token response and calls onTokenChange to propogate change back to client
  this.removeTokenResponse = function(params) {
    console.log("parms", params)
    for (var a=0; a<that.tokenResponses.length; a++) {
      if (that.tokenResponses[a].userEmail == params.userEmail) {
        that.tokenResponses.splice(a, 1);
        break;
      }
    }
    that.onTokenChange(null, that.tokenResponses);
  }

  this.removeAllTokenResponses = function() {
    that.tokenResponses = [];
    that.onTokenChange(null, that.tokenResponses);
  }

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

            // google.getContacts(tokenResponse.access_token);
            that.getContacts(tokenResponse);

            // that.getUserEmail(tokenResponse, function(params) {
            //   if (params.userEmail && !params.error) {
            //     // add this to response
            //     tokenResponse.userEmail = params.userEmail;
                
            //     var tokenResponseFromMemory = that.findTokenResponse(params);
            //     if (tokenResponseFromMemory) {
            //       // update if exists
            //       tokenResponseFromMemory = tokenResponse;
            //     } else {
            //       // add new token response
            //       that.tokenResponses.push(tokenResponse);
            //     }
            //     var callbackParams = {tokenResponse:tokenResponse};
            //     onTokenChangeWrapper(callbackParams);
            //     callback(callbackParams);
            //   } else {
            //     callback(params);
            //   }
            // });
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


