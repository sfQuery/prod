sfQuery: jQuery plugin for Salesforce.com
-------------------------
This plugin makes using jQuery with Salesforce extremely simple. It comes bundled with functionality to ease the use of advanced Visualforce features like JS SOQL connections and JS remoting.

Querying elements
----------------------
Querying for DOM elements using jQuery is very simple. Querying for elements in a Visualforce page using jQuery is a little tricky. sfQuery simplifies this by allowing you to use standard *$Component* references.

```
var elem = sfQuery('{!$Component.mainForm.mainBlock.mainSection.elementId}');
```