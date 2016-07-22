
var GoogleCalendarData = {
  data: [],
  get: function(message) {
    this.data = [];
    var customer = JSON.parse(message);
    for (var i = 0; i < customer.length; i++) {
      var customerList = customer[i];
      for (var j = 0; j < customerList.length; j++) {
        this.data.push(customerList[j]);
      };
    };
    GoogleCalendarQuickEvent.data = this.data;
    GoogleCalendarEvent.data = this.data;
  }
}

var GoogleCalendarQuickEvent = {
  data: [],
  isActive: 0,
  shiftKey: false,
  showingSuggestions: false,
  googleField: false,
  backgroundId: 'event-background',
  foregroundId: 'event-main',
  title: '.gcal-textinput',
  quickEvent: function() {
    var _this = this;
    $(document).keydown(function(e) {

      var code = (e.keyCode? e.keyCode : e.charCode);

      if(code === 16) {
        shiftKey = true;
      }

      if(code === 187 && shiftKey) {
        _this.showForeground();
      }

      if(code === 13) {
        if(_this.googleField === true) {
          _this.apiCall();
        }
      }
      
      _this.isActive = $(_this.title).attr('active');

      if(!_this.isActive && _this.data.length > 0) {
        $(_this.title).attr('active', 'true').attr('id', _this.backgroundId);
        $($('.tile-content')[0]).append('<input class="gcal-textinput" style="display:none;" id="' + _this.foregroundId + '" value="" />');
        $('#' + _this.foregroundId).focus();
        
        _this.autoCompleteQuick();
      }

    }).keyup(function(e) {

      var code = (e.keyCode? e.keyCode : e.charCode);
      // console.debug("up: " + code);

      if(code == 16) {
        shiftKey = false;
      }

      if(code === 13) {
        _this.showBackground();
      } 

      if (code === 27) {
        // esc pressed
        $(_this.title).autocomplete('dispose');
        $('.autocomplete-suggestions').remove();
      }
    }).mouseup(function(e) {
      if(!_this.showingSuggestions) {
        return;
      }
      $('#' + _this.foregroundId).val($('#' + _this.foregroundId).val() + " ");
      _this.showBackground();
    });
  },
  checkInputs: function() {

    this.foregroundInput = $('#' + this.foregroundId);
    this.backgroundInput = $('#' + this.backgroundId);

    // check if we are in overview or specific event
    if(this.foregroundInput.length < 1 || this.backgroundInput.length < 1) { 
      return false;
    }
    return true;
  },
  // recording for anonymous stats
  apiCall: function() {
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
  },
  // foreground is for displaying dropdown
  showForeground: function() {

    if(!this.checkInputs()) {
      return;
    }

    this.googleField = false;

    var regex = new RegExp(/\+/, "gi");
    var hasExistingPlus = this.backgroundInput.val().match(regex);

    if(this.foregroundInput.css('display') != "none" || hasExistingPlus) {
      return;
    }
    this.backgroundInput.hide();
    this.foregroundInput.val(this.backgroundInput.val()).show().focus();
  },
  // background is google input field (for saving actual data)
  showBackground: function() {
    if(!this.checkInputs()) {
      return;
    }
    this.googleField = true;
    this.foregroundInput.hide();
    this.backgroundInput.val($('#' + this.foregroundId).val()).show().focus();
  },

  autoCompleteQuick: function() {

    if(!this.checkInputs()) {
      return;
    }

    var _this = this;
    var stringToReplace = "";
    var $field = this.foregroundInput;

    var appendTo = $($('#' + this.foregroundId).parent());

    $field.autocomplete({
          lookup: _this.data,
          minChars: 1,
          appendTo: appendTo,
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
                  _this.showingSuggestions = true;
                  _this.showForeground();
                }
                return showAutoComplete;
              } else {
                _this.showingSuggestions = false;
                return false;
              }
          },
          onSelect: function (suggestion) {

              var replaceWith = "+" + suggestion.value;

              var stringToReplaceRegex = new RegExp($.Autocomplete.utils.escapeRegExChars("+" + stringToReplace), 'i');

              var newValue = $field.val().replace(stringToReplaceRegex, replaceWith);
              
              $('#' + _this.backgroundId).val(newValue);
              
              $field.val(newValue + " ");

              _this.showingSuggestions = false;

          },
          showNoSuggestionNotice: false,
          noSuggestionNotice: 'Sorry, no matching results',
          groupBy: 'category'
      });
  },
  init: function() {
    // console.debug('Google Calendar Loaded');
    this.quickEvent();
  }
};

$(function() {
  GoogleCalendarQuickEvent.init();
});

chrome[runtimeOrExtension].onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.message) {
      GoogleCalendarData.get(request.message);
    }
  }
);
