$(function() {

  console.debug('Google Calendar Loaded');

  var nfl = ['+Cool Cars'];
  var data = $.map(nfl, function (team) { return { value: team, data: { category: 'Customers' }}; });
  // var nba = $.map(nbaTeams, function (team) { return { value: team, data: { category: 'NBA' } }; });
  // var teams = nhl.concat(nba);
  
  $(document).mouseup(function() {
    var title = '.cb-event-title-input';
    autoComplete(title, data);
  });

});


function autoComplete(title, data) {
  $(title).autocomplete({
        lookup: data,
        minChars: 1,
        delimiter: ' ',
        lookupFilter: function(suggestion, originalQuery, queryLowerCase) {
            var re = new RegExp('\\b' + $.Autocomplete.utils.escapeRegExChars(queryLowerCase), 'gi');
            if(!queryLowerCase.startsWith('+')) {
              return false;
            } else {
              return true;
            }
            // return re.test(suggestion.value);
        },
        formatResult: function(suggestion, currentValue) {
          return "Cool Cars";
        },
        // onSelect: function (suggestion) {
        //   console.debug(suggestion.value);
        //     $('#selection').html('You selected: ' + suggestion.value + ', ' + suggestion.data.category);
        // },
        showNoSuggestionNotice: false,
        noSuggestionNotice: 'Sorry, no matching results',
        groupBy: 'category'
    });
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}
