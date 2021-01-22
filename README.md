# chrome_extension
A chrome extension to support hate/violence takedown requests

To test this extension out, you can download the code and navigate to chrome://extensions on your chrome browser. Then click on "Load unpacked" and find the directory where the code is. It should "just work", and will create a little heart in the extension area of the search bar which allows you to find out what kinds of resources a site relies on.

This extension looks at all the resources being loaded by any active tab, and when directly queried from a tab (by clicking the heart) it will do a whois lookup to determine that tab's domain registrar as well as presenting to the user all of the data from the tab's resource loads. So a user should be able to identify shop sites, payment services, hosting services, etc.

It displays a little list of all the services it detects, along with links to their Terms of Service and their abuse contact email or form.
