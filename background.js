var views = chrome.extension.getViews({
    type: "popup"
});
let providerList = undefined;
for (var i = 0; i < views.length; i++) {
    var listMaybe = views[i].document.getElementById('providerList');
    if (listMaybe != undefined) {
      providerList = listMaybe;
      break;
    }
}

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


/* Keep track of the active tab in each window */
var activeTabs = {};

chrome.tabs.onActivated.addListener(function(details) {
    activeTabs[details.windowId] = details.tabId;
});

/* Clear the corresponding entry, whenever a window is closed */
chrome.windows.onRemoved.addListener(function(winId) {
    delete(activeTabs[winId]);
});

/* Listen for web-requests and filter them */
chrome.webRequest.onBeforeRequest.addListener(function(details) {
//chrome.devtools.network.onRequestFinished.addListener(function(details) {
    if (details.tabId == -1) {
        console.log("Skipping request from non-tabbed context...");
        return;
    }

    var notInteresting = Object.keys(activeTabs).every(function(key) {
        if (activeTabs[key] == details.tabId) {
            /* We are interested in this request */
            console.log("Check this out:", details);
            return false;
        } else {
            return true;
        }
    });

    if (notInteresting) {
        /* We are not interested in this request */
        console.log("Just ignore this one:", details);
    }
}, { urls: ["<all_urls>"] });

/* Get the active tabs in all currently open windows */
chrome.tabs.query({ active: true }, function(tabs) {
    tabs.forEach(function(tab) {
        activeTabs[tab.windowId] = tab.id;
    });
    console.log("activeTabs = ", activeTabs);
});

console.log("MUTHAFUCKAAAAAA");

// chrome.devtools.network.getHAR(function(result) {
//   var entries = result.entries;
//   if (!entries.length) {
//     console.warn("Reload the page to get all the entries!");
//   }
//   for (var i = 0; i < entries.length; ++i)
//     //DontHostHate.handleHARs(entries[i]);
//
//     chrome.devtools.network.onRequestFinished.addListener(
//       function(request) {
//         if (request.response.bodySize > 40*1024) {
//           chrome.devtools.inspectedWindow.eval(
//               'console.log("Large image: " + unescape("' +
//               escape(request.request.url) + '"))');
//         } else {
//           chrome.devtools.inspectedWindow.eval(
//               'console.log("smol thing : " + unescape("' +
//               escape(request.request.url) + '"))');
//         }
//       }
//     );
// });
