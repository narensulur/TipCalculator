var customers = [];
var data = [];

$(function() {

  console.debug('Google Calendar Loaded');

  // customers = ['Cool Cars'];
  data = $.map(customers, function (customer) { return { value: customer, data: { category: 'Customers' }}; });
  
  $(document).mouseup(function() {
    var title = '.cb-event-title-input';
    autoComplete(title, data);
  });

});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // if( request.message === "mom" ) {
    //   console.debug(sendResponse);
    // }
    var json = JSON.parse(request.message);
    // console.debug(json.connections);
    for (var i = 0; i < json.connections.length; i++) {
      var person = json.connections[i];
      customers.push(person.names[0].displayName);
    }
    data = $.map(customers, function (customer) { return { value: customer, data: { category: 'Customers' }}; });
    // console.debug(customers);
  }
);
  


function autoComplete(title, data) {

  var stringToReplace = "";
  var $field = $(title);

  $field.autocomplete({
        lookup: data,
        minChars: 1,
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
            $field.val(newValue + " ");

        },
        showNoSuggestionNotice: false,
        noSuggestionNotice: 'Sorry, no matching results',
        groupBy: 'category'
    });
}
