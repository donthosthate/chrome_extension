# chrome_extension
A chrome extension to support hate/violence takedown requests

To test this extension out, you can download the code (clone it, or download the zip and unzip it) and navigate to chrome://extensions on your Chrome browser. Then click "Load unpacked" and select the directory where the code is. It should "just work", and will create a little heart in the extension area of the search bar which allows you to find out what kinds of resources a site relies on.

This extension looks at all the resources being loaded by any active tab, and when directly queried from a tab (by clicking the heart) it will present the data. Optionally, a user can add a whois API key and a Google Sheets API key to get nicely-formatted data and to do domain registrar lookup. These API keys can be added by clicking the "#DontHostHate Extension Options" button that appears when the heart is clicked.

It displays a little list of all the services it detects, and if the Sheets API is added it will also display links to their Terms of Service and their abuse contact email or form.
