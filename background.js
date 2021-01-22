/* Keep track of the active tab in each window */
var activeTabs = {};

/* Track the TLDs loaded by any of the active tabs */
var activeTabsLoadedURLs = new Map();

/*
Standardize the way we clean URL strings ...
In particular, I want to use the TLD and none of the optional pre-stuff.
*/
function cleanUrlString(urlString) {
  var url = new URL(urlString).hostname;
  var bits = url.split('.')
  return bits.splice(bits.length - 2).join('.')
}

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
    if (details.tabId == -1 || !details.initiator || !details.initiator.startsWith("http")) {
        //console.log("Skipping request from non-tabbed or non-web context...");
        return;
    }

    // not interesting unless the tab is active
    var notInteresting = Object.keys(activeTabs).every(function(key) {
        if (activeTabs[key] == details.tabId) {
            /* We are interested in this request */
            // log the request
            //console.log("Check this out: ", details);
            hostname_requestor = cleanUrlString(details.initiator);
            hostname_requested = cleanUrlString(details.url);
            addToActiveTabs(hostname_requestor, hostname_requested);
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

// send back all the info once it's got
function sendPopupAllInfoAboutURL(url, port) {
    // we want to send back all the websites we have found that were loaded by this link's TLD
    loadedByTLD = activeTabsLoadedURLs.get(url)
    uniqueLoadedByTLD = [...new Set(loadedByTLD)]
    tldsOfInterest = {"tlds": uniqueLoadedByTLD};
    port.postMessage(tldsOfInterest);
    console.log("message sent to popup!", tldsOfInterest);
}

// from stackoverflow
var parseXml;
if (typeof window.DOMParser != "undefined") {
    parseXml = function(xmlStr) {
        return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
    };
} else if (typeof window.ActiveXObject != "undefined" &&
       new window.ActiveXObject("Microsoft.XMLDOM")) {
    parseXml = function(xmlStr) {
        var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(xmlStr);
        return xmlDoc;
    };
} else {
    throw new Error("No XML parser found");
}

// add something to the active tabs tracker map list thing
function addToActiveTabs(tab_url, url_to_add) {
  if (activeTabsLoadedURLs.has(tab_url)) {
    activeTabsLoadedURLs.get(tab_url).push(url_to_add);
  }
  else {
    activeTabsLoadedURLs.set(tab_url, [url_to_add]);
  }
}

// this will let us whois a domain
function whoisAsync(theUrl, callback)
{
    var WHOISAPIKEY = "at_17WvJwRnLT3yghrTBokJUTjsn98Sy"
    var whoisURL = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${WHOISAPIKEY}&domainName=${theUrl}`
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          callback(parseXml(xmlHttp.responseText))
        }
    }
    xmlHttp.open("GET", whoisURL, true); // true for asynchronous
    xmlHttp.send(null);
}

//for receiving and responding to a message
chrome.extension.onConnect.addListener(function(port) {
      console.log("Connected to popup");
      port.onMessage.addListener(function(msg) {
        console.log("message received from popup!", msg);

        // tabOfInterest: tablink
        strippedLink = cleanUrlString(msg['tabOfInterest']);

        // we also need to whois the requestor to get the domain registrar
        whoisAsync(strippedLink, function(strippedLink, port, xml) {
          // we only actually care about the registering company
          // horrifyingly, this is not in tagged HTML but rather in a "rawText" block >:(
          console.log("xml I received: ", xml)
          var rawtexts = xml.getElementsByTagName("rawText")
          var DESIRED_TAG = /Registrar URL: (?<URL>.*?)\n/
          for (let item of rawtexts) {
              var leMatch = item.innerHTML.match(DESIRED_TAG)
              if (leMatch) {
                var registrarURL = cleanUrlString(leMatch.groups["URL"]);
                addToActiveTabs(strippedLink, registrarURL);
                break;
              }
          }
          sendPopupAllInfoAboutURL(strippedLink, port)
        }.bind(null, strippedLink, port));
      });
 })
