
var GoogleCalendarEvent = {
  
  data: [],
  id: "eventTitle",
  title: ".ep-title .textinput",
  isActive: false,
  showingSuggestions: false,

  init: function() {
    var _this = this;

    $(document).on('keydown', function(e) {

      if($(_this.title).length < 1) { return; }

      _this.isActive = $(_this.title).attr('active');

      if(!_this.isActive && _this.data.length > 0) {
        // console.debug("Main event");
        $(_this.title).attr('active', 'true').attr('id', _this.id);
        _this.autoComplete();
      }

    });
  },

  autoComplete: function() {

    var _this = this;
    var stringToReplace = "";
    var $field = $(this.title);
    var appendTo = $(".ep-title");

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
                  // var regex = new RegExp(/\+/, "gi");
                  // var hasExistingPlus = $field.val().match(regex);
                  // if(hasExistingPlus) {
                  //   return;
                  // }
                }
                return showAutoComplete;
              } else {
                return false;
              }
          },
          onSelect: function (suggestion) {
              var replaceWith = "+" + suggestion.value;
              var stringToReplaceRegex = new RegExp($.Autocomplete.utils.escapeRegExChars("+" + stringToReplace), 'i');
              var newValue = $field.val().replace(stringToReplaceRegex, replaceWith);
              $field.val(newValue + " ");
          },
          showNoSuggestionNotice: false,
          noSuggestionNotice: 'Sorry, no matching results',
          groupBy: 'category'
      });
  }
}

$(function() {
  GoogleCalendarEvent.init();
});