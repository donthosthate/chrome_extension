/* Keep track of the active tab in each window */
var activeTabs = {};

/* Track the TLDs loaded by any of the active tabs */
var activeTabsLoadedURLs = new Map();

/* Listen for when we activate a new tab */
chrome.tabs.onActivated.addListener(function(details) {
    activeTabs[details.windowId] = details.tabId;
});

/* Clear the corresponding entry, whenever a window is closed */
chrome.windows.onRemoved.addListener(function(winId) {
    delete(activeTabs[winId]);
});

/* Listen for web-requests and filter them */
chrome.webRequest.onBeforeRequest.addListener(function(details) {
    if (details.tabId == -1) {
        console.log("Skipping request from non-tabbed context...");
        return;
    }

    var notInteresting = Object.keys(activeTabs).every(function(key) {
        if (activeTabs[key] == details.tabId) {
            /* We are interested in this request */
            console.log("Check this out: ", details);
            hostname_requestor = new URL(details.initiator).hostname;
            hostname_requested = new URL(details.url).hostname;
            if (activeTabsLoadedURLs.has(hostname_requestor)) {
              activeTabsLoadedURLs.get(hostname_requestor).push(hostname_requested);
            }
            else {
              activeTabsLoadedURLs.set(hostname_requestor, [hostname_requested]);
            }
            return false;
        } else {
            return true;
        }
    });

    if (notInteresting) {
        /* We are not interested in this request */
        //console.log("Just ignore this one:", details);
    }
}, { urls: ["<all_urls>"] });

/* Get the active tabs in all currently open windows */
chrome.tabs.query({ active: true }, function(tabs) {
    tabs.forEach(function(tab) {
        activeTabs[tab.windowId] = tab.id;
    });
    console.log("activeTabs = ", activeTabs);
});

//for sending a message
//chrome.runtime.sendMessage({tlds: ["shopify.com","wp.com"]}, function(response) {});


function messageReceived(msg) {
   console.log("message received from popup!", msg);
   // tabOfInterest: tablink
   // we want to send back all the websites we have found that were loaded by this link's TLD
   // for now, we send a test message...
   tldsOfInterest = {"tlds": ["shopify.com","wp.com"]};
   chrome.runtime.sendMessage(tldsOfInterest, function(response) {return true;});
   console.log("message sent to popup!", tldsOfInterest);
   return true;
}

chrome.extension.onConnect.addListener(function(port) {
      console.log("Connected to popup");
      port.onMessage.addListener(function(msg) {
        console.log("message received from popup!", msg);
        // tabOfInterest: tablink
        // we want to send back all the websites we have found that were loaded by this link's TLD
        // for now, we send a test message...
        tldsOfInterest = {"tlds": ["shopify.com","wp.com"]};
        port.postMessage(tldsOfInterest);
        console.log("message sent to popup!", tldsOfInterest);
      });
 })


//for listening any message which comes from runtime
chrome.runtime.onMessage.addListener(messageReceived);

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
