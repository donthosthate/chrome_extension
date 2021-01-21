let providerList = document.getElementById('providerList');

// spreadsheet location from url
var SPREADSHEET_KEY = '1lklFq55OkWwbzsc0X52yqhlJYxRncwVhKFjnZ1-JPV8';
// API key from the developer console
var API_KEY = 'AIzaSyAa10uhcAU08bFvxpQiM8cArW6tlRH6YZQ';
// this is an extremely aggressive range. :D
var RANGE = 'A1:ZZ10000'
var spreadsheet_url =  `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_KEY}/values/${RANGE}?key=${API_KEY}`
var spreadsheet_data = [];

/**
 * Get all the data from the spreadsheet!
 * https://docs.google.com/spreadsheets/d/1lklFq55OkWwbzsc0X52yqhlJYxRncwVhKFjnZ1-JPV8/edit
 */
function getProvidersList() {
  fetch(spreadsheet_url).then(function(response) {
      return response.json();
    }).then(function(result) {
      spreadsheet_data = result.values;
      displayProviders();
    });
}

function displayProviders() {
  // Ordering from the spreadsheet
  var name_col = spreadsheet_data[0].indexOf('Name');
  var url_col = spreadsheet_data[0].indexOf('URL');
  var provides_col = spreadsheet_data[0].indexOf('Provides');
  var tos_col = spreadsheet_data[0].indexOf('TOS');
  var clause_col = spreadsheet_data[0].indexOf('Clause');
  var contact_col = spreadsheet_data[0].indexOf('Contact');

  // go through the remaining rows of the spreadsheet and parse 'em
  var providers = spreadsheet_data.slice(1).map(function(provider, i) {
    var ulNode = document.createElement("li");
    var providerNode = `<b>${provider[name_col]}</b> (${provider[provides_col]}): <a href="${provider[tos_col]}#:~:text=${escape(provider[clause_col])}">Terms of Service</a> and <a href="${provider[contact_col]}">contact</a>`
    // how to highlight text in Chrome: url...bla#:~:text=escaped%20text
    ulNode.innerHTML = providerNode;

    // only show it if it is germane to this particular website. for now, if random :p
    if (Math.random() > .8)
      return ulNode;
    return undefined;
  });

  // strip out null providers before display
  providers = providers.filter(function(provider) {
    return provider != undefined;
  });

  for (var i = 0; i < providers.length; i++) {
    providerList.appendChild(providers[i]);
  }
  console.log(providerList);
}

getProvidersList();
