var customers = [];
var data = [];
var isActive = 0;

$(function() {

  console.debug('Google Calendar Loaded');

  $(document).keydown(function() {
    var title = '.cb-event-title-input';
    isActive = $(title).attr('active');
    if(!isActive && data.length > 0) {
      $(title).attr('active', 'true');
      autoComplete(title, data);
    }
  });

});

chrome[runtimeOrExtension].onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.message) {
      console.debug(request);
      var customers = JSON.parse(request.message);
      data = $.map(customers, function (customer) { return { value: customer, data: { category: 'Customers' }}; });
    }
  }
);

function autoComplete(title, data) {

  var stringToReplace = "";
  var $field = $(title);

  $field.autocomplete({
        lookup: data,
        minChars: 1,
        appendTo: $('.textbox-fill-wrapper'),
        preserveInput: true,
        // delimiter: '+',
        lookupFilter: function(suggestion, originalQuery, queryLowerCase) {
          var phraseRegEx = new RegExp('\\+(.*)\\s?', 'gi');
            var phrase = phraseRegEx.exec(queryLowerCase);
            if(phrase) {
              stringToReplace = phrase[0].replace('+', '');
              var re = new RegExp('\\b' + $.Autocomplete.utils.escapeRegExChars(stringToReplace), 'gi');
              return re.test(suggestion.value);
            } else {
              return false;
            }
        },
        // formatResult: function(suggestion, currentValue) {
        //   return "San Francisco 49ers";
        // },
        onSelect: function (suggestion) {

            var replaceWith = "+" + suggestion.value;

            var stringToReplaceRegex = new RegExp($.Autocomplete.utils.escapeRegExChars("+" + stringToReplace), 'i');

            var newValue = $field.val().replace(stringToReplaceRegex, replaceWith);
            $field.val(newValue + " ").focus();

        },
        showNoSuggestionNotice: false,
        noSuggestionNotice: 'Sorry, no matching results',
        groupBy: 'category'
    });
}
