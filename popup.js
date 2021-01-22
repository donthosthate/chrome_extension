let providerList = document.getElementById('providerList');
let providerCaption = document.getElementById('knownCaption');
let unknownList = document.getElementById('unknownList');
let unknownCaption = document.getElementById('unknownCaption');
let providers = new Map();

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
      sortProviders();
    });
}

// once we get all the spreadsheet data, turn it into some nice little display items
function sortProviders() {
  // Ordering from the spreadsheet
  var name_col = spreadsheet_data[0].indexOf('Name');
  var url_col = spreadsheet_data[0].indexOf('URL');
  var provides_col = spreadsheet_data[0].indexOf('Provides');
  var tos_col = spreadsheet_data[0].indexOf('TOS');
  var clause_col = spreadsheet_data[0].indexOf('Clause');
  var contact_col = spreadsheet_data[0].indexOf('Contact');

  // go through the remaining rows of the spreadsheet and parse 'em
  spreadsheet_data.slice(1).map(function(provider, i) {
    var ulNode = document.createElement("li");
    var providerNode = `<b>${provider[name_col]}</b> (${provider[provides_col]}): <a href="${provider[tos_col]}#:~:text=${escape(provider[clause_col])}">Terms of Service</a> and <a href="${provider[contact_col]}">abuse contact</a>`
    // how to highlight text in Chrome: url...bla#:~:text=escaped%20text
    ulNode.innerHTML = providerNode;

    providers.set(provider[url_col], ulNode);
  });

  // when we actually load the popup, we need to let our background tab know which url we want deets for
  // note that we moved this into the sort function... we can't do it before we have the other info
  chrome.tabs.getSelected(null,function(tab) {
      var tablink = tab.url;
      //for sending a message
      port.postMessage({tabOfInterest: tablink});
  });
}

function createBareListItem(url) {
  var ulNode = document.createElement("li");
  ulNode.innerHTML = `<a href="${url}">${url}</a>`
  return ulNode;
}

// take some tlds and actually display them in the thing
function displayProviders(tlds) {
  // clear the providersList
  providerList.textContent = '';
  if (typeof tlds !== 'undefined') {
    for (var i = 0; i < tlds.length; i++) {
      if (providers.has(tlds[i])) {
        providerList.appendChild(providers.get(tlds[i]));
      } else {
        unknownList.appendChild(createBareListItem(tlds[i]));
      }
    }
    // once we look at all the tlds, we need to flag for the user if something wasn't found.
    if (providerList.childElementCount == 0) {
      providerCaption.innerHTML = "I didn't detect any known providers."
    }
    if (unknownList.childElementCount > 0) {
      unknownCaption.innerHTML = "Unknown service providers (cookies? other?):";
    }
  } else {
    providerList.innerHTML = "I didn't detect anything. Try reloading the page to try again."
  }
}

function messageReceived(msg) {
  // tlds: ["shopify.com","wp.com"]
  displayProviders(msg["tlds"]);
  return true;
}

var port = chrome.extension.connect({
  name: "TLD Transfer Pipe"
});
port.onMessage.addListener(messageReceived);

//for listening any message which comes from runtime
//chrome.runtime.onMessage.addListener(messageReceived);

getProvidersList();
