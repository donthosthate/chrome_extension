// Saves options to chrome.storage
function save_options() {
  var googleapi = document.getElementById('googleapi').value;
  var whoisapi = document.getElementById('whoisapi').value;
  chrome.storage.sync.set({
    googleapi: googleapi,
    whoisapi: whoisapi
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default values of "" for both api keys
  chrome.storage.sync.get({
    googleapi: "",
    whoisapi: ""
  }, function(items) {
    document.getElementById('googleapi').value = items.googleapi;
    document.getElementById('whoisapi').value = items.whoisapi;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
