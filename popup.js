let providerList = document.getElementById('providerList');
let providerCaption = document.getElementById('knownCaption');
let unknownList = document.getElementById('unknownList');
let unknownCaption = document.getElementById('unknownCaption');
let providers = new Map();

// spreadsheet location from url
var SPREADSHEET_KEY = '1lklFq55OkWwbzsc0X52yqhlJYxRncwVhKFjnZ1-JPV8';
// API key from the developer console
var API_KEY = '';
// this is an extremely aggressive range. :D
var RANGE = 'A1:ZZ10000'
var spreadsheet_data = [];

var gapi_error = false;

/**
 * Get all the data from the spreadsheet!
 * https://docs.google.com/spreadsheets/d/1lklFq55OkWwbzsc0X52yqhlJYxRncwVhKFjnZ1-JPV8/edit
 */
function getProvidersList(sendMessage = true) {
  // try to fetch. we don't bother catching an error if there's no key, we just go for it. it'll fail later, but at least we'll get a list of the unknown providers from the backend.
  var spreadsheet_url =  `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_KEY}/values/${RANGE}?key=${API_KEY}`
  fetch(spreadsheet_url).then(function(response) {
      return response.json();
    }).then(function(result) {
      if (result.error) {
        // if error, let the user know we failed to get spreadsheet
        spreadsheetGetFail();
        gapi_error = true;
      } else {
        // otherwise, use our data!
        spreadsheet_data = result.values;
        sortProviders();
        gapi_error = false;
      }
      if (sendMessage) {
        // let our background tab know we're ready for info
        chrome.tabs.getSelected(null,function(tab) {
            var tablink = tab.url;
            //for sending a message
            port.postMessage({tabOfInterest: tablink});
        });
      }
    });
}

// allow graceful failure
function spreadsheetGetFail() {
  // if the user didn't add an api key yet, we can't really use the spreadsheet providers, so warn and skip
  var ulNode = document.createElement("li");
  ulNode.innerHTML = "<div class='red'>Error with google spreadsheet key! Can't detect known providers. See extension options for more info.</div>";
  providerList.innerHTML = "";
  providerList.appendChild(ulNode)
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
    var providerNode = `<b>${provider[name_col]}</b> (${provider[provides_col]}): <a href="${provider[tos_col]}#:~:text=${escape(provider[clause_col])}" target="_blank">Terms of Service</a> and <a href="${provider[contact_col]}" target="_blank">abuse contact</a>`
    // how to highlight text in Chrome: url...bla#:~:text=escaped%20text
    ulNode.innerHTML = providerNode;

    providers.set(provider[url_col], ulNode);
  });
}

function createBareListItem(url) {
  var ulNode = document.createElement("li");
  ulNode.innerHTML = `<a href="http://${url}" target="_blank">${url}</a>`
  return ulNode;
}

// take some tlds and actually display them in the thing
function displayProviders(tlds) {
  // clear the providersList
  providerList.textContent = '';
  if ((typeof tlds !== 'undefined') && (tlds.length > 0)) {
    for (var i = 0; i < tlds.length; i++) {
      if (providers.has(tlds[i])) {
        providerList.appendChild(providers.get(tlds[i]));
      } else {
        unknownList.appendChild(createBareListItem(tlds[i]));
      }
    }
    // once we look at all the tlds, we need to flag for the user if something wasn't found.
    if (providerList.childElementCount == 0) {
      if (gapi_error) {
        spreadsheetGetFail();
      } else {
        providerCaption.innerHTML = "I didn't detect any known providers."
      }
    }
    if (unknownList.childElementCount > 0) {
      unknownCaption.innerHTML = "Un-sorted service providers";
    }
  } else {
    providerList.innerHTML = "I didn't detect anything. Try reloading the page to try again."
  }
}

function messageReceived(msg) {
  if (gapi_error) {
    tryForKey();
    if (API_KEY != '')
      getProvidersList(sendMessage=false);
  }
  // tlds: ["shopify.com","wp.com"]
  displayProviders(msg.tlds);
  // if we got an error, show it
  if (msg.error) {
    var ulNode = document.createElement("li");
    ulNode.innerHTML = "<div class='red'>" + msg.error + "</div>";
    providerList.appendChild(ulNode);
  }
  return true;
}

// open a port to our background page
var port = chrome.extension.connect({
  name: "TLD Transfer Pipe"
});
port.onMessage.addListener(messageReceived);

// load the saved API key for google spreadsheets. then load the providers from the sheet
function tryForKey() {
  chrome.storage.sync.get({
    googleapi: "",
  }, function(items) {
    API_KEY = items.googleapi;
  });
}
// load the first time, though.
chrome.storage.sync.get({
  googleapi: "",
}, function(items) {
  API_KEY = items.googleapi;
  getProvidersList();
});

// allow users to get to the options options page
document.querySelector('#go-to-options').addEventListener('click', function() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});
