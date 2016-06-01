var customers = [];
var data = [];
var isActive = 0;
var shiftKey = false;
var showingSuggestions = false;
var googleField = false;

var backgroundId = 'event-background';
var foregroundId = 'event-main';

var title = '.gcal-textinput';

$(function() {

  console.debug('Google Calendar Loaded');

  $(document).keydown(function(e) {

    var code = (e.keyCode? e.keyCode : e.charCode);
    // console.debug("down: " + code);
    if(code === 16) {
      shiftKey = true;
    }

    if(code === 187 && shiftKey) {
      showForeground();
    }

    if(code === 13) {
      // console.debug('ENTER');
      // console.debug(googleField);
      if(googleField === true) {
        //send to API
        apiCall();
      }
    }
    
    isActive = $(title).attr('active');

    if(!isActive && data.length > 0) {
      $(title).attr('active', 'true').attr('id', backgroundId);
      $($('.tile-content')[0]).append('<input class="gcal-textinput" style="display:none;" id="' + foregroundId + '" value="" />');
      $('#' + foregroundId).focus();
      autoComplete(data);
    }

  }).keyup(function(e) {

    var code = (e.keyCode? e.keyCode : e.charCode);
    // console.debug("up: " + code);

    if(code == 16) {
      shiftKey = false;
    }

    if(code === 13) {
      showBackground();
    } 

    if (code === 27) {
      // esc pressed
      $(title).autocomplete('dispose');
      $('.autocomplete-suggestions').remove();
    }
  }).mouseup(function(e) {
    if(!showingSuggestions) {
      return;
    }
    $('#' + foregroundId).val($('#' + foregroundId).val() + " ");
    showBackground();
  });

});

chrome[runtimeOrExtension].onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.message) {
      data = [];
      var customer = JSON.parse(request.message);
      for (var i = 0; i < customer.length; i++) {
        var customerList = customer[i];
        for (var j = 0; j < customerList.length; j++) {
          data.push(customerList[j]);
        };
      };
      // console.debug(data);
    }
  }
);

function apiCall() {
  $.ajax({
      type: "GET",
      url: "https://connector.appconnect.intuit.com/intuit/api/google-extension-add.json?token=k3thk1cdn8l212g",
      timeout: 45000,
      complete: function(jqXHR, textStatus) {
        var status = getStatus(jqXHR, textStatus);
        if (status == 200 || status == 204) {
          // console.debug("API got it");
        }
      }
    });
}

function showForeground() { // duplicated field
  googleField = false;
  $foreground = $('#' + foregroundId);
  $background = $('#' + backgroundId);

  var regex = new RegExp(/\+/, "gi");
  var hasExistingPlus = $background.val().match(regex);

  if($foreground.css('display') != "none" || hasExistingPlus) {
    return;
  }
  $background.hide();
  $foreground.val($background.val()).show().focus();
}

function showBackground() { // Google input field
  googleField = true;
  $('#' + foregroundId).hide();
  $('#' + backgroundId).val($('#' + foregroundId).val()).show().focus();
}

function autoComplete(data) {

  var stringToReplace = "";
  var $field = $('#' + foregroundId);

  var appendTo = $('body');

  $field.autocomplete({
        lookup: data,
        minChars: 1,
        appendTo: $($('#' + foregroundId).parent()),
        tabDisabled: true,
        // forceFixPosition: true,
        preserveInput: true,
        lookupFilter: function(suggestion, originalQuery, queryLowerCase) {
          var phraseRegEx = new RegExp('\\+(.*)\\s?', 'gi');
            var phrase = phraseRegEx.exec(queryLowerCase);
            if(phrase) {
              stringToReplace = phrase[0].replace('+', '');
              var re = new RegExp('\\b' + $.Autocomplete.utils.escapeRegExChars(stringToReplace), 'gi');
              var showAutoComplete = re.test(suggestion.value);
              if(showAutoComplete === true) {
                showingSuggestions = true;
                showForeground();
              }
              return showAutoComplete;
            } else {
              showingSuggestions = false;
              return false;
            }
        },
        onSelect: function (suggestion) {

            var replaceWith = "+" + suggestion.value;

            var stringToReplaceRegex = new RegExp($.Autocomplete.utils.escapeRegExChars("+" + stringToReplace), 'i');

            var newValue = $field.val().replace(stringToReplaceRegex, replaceWith);
            
            $('#' + backgroundId).val(newValue);
            
            $field.val(newValue + " ");

            showingSuggestions = false;

        },
        showNoSuggestionNotice: false,
        noSuggestionNotice: 'Sorry, no matching results',
        groupBy: 'category'
    });
}
