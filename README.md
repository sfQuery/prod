##sfQuery: jQuery plugin for [Salesforce.com](http://www.salesforce.com)
This plugin makes using jQuery with Salesforce extremely simple. It normalizes the way you query 
for elements in Visualforce. It also comes packed with functionality to ease the use of advanced Visualforce 
features like JS SOQL connections and JS remoting. The plugin is built on top of jQuery so you have access to everything
jQuery has to offer as well. All of this is merged into one plugin for SFDC!

###Querying elements
----------------------
Querying for DOM elements using jQuery is very simple. Querying for elements in a Visualforce page using jQuery is a little tricky. sfQuery simplifies this by allowing you to use standard *$Component* references.

```JavaScript
// Example query selector using standard VF Component object
var elem = sfQuery('{!$Component.mainForm.mainBlock.mainSection.elementId}');

// Since sfQuery runs on jQuery, you can use any valid jQuery selector as well!
sfQuery(document).ready(function(e) {
	alert('Hello from sfQuery!');
});

var header = sfQuery('#headerId');

sfQuery('#headerId').on('load', function(e) {
	alert('Header loaded!');
});
```

###JS SOQL connections
You can query records in a visualforce page using the *sforce* connection. This is less than ideal because it requires a lot of setup:
* Handling success and error conditions is not normalized and difficult
* The records in the response of the native sforce connection are not returned in a clean "query-list" way

sfQuery has 2 methods that normalize and ease the use of this functionality. You can use the static method in the *jQuery.SFQuery* namespace or you can attach a soql query action to an element.

```JavaScript
/**
* Example using the static method
**/
// Get a reference to the button
var button = sfQuery('{!$Component.mainForm.mainBlock.mainSection.buttonId}');
button.click(function() {
	jQuery.SFQuery.soqlQuery({
		query: 'Select Id, Name from Account limit 10',
		success: function(result, state) {
			sfQuery('#spanElem').html('First account is: ' + result[0].Name);
		},
		error: function(error, source) {
	        alert('An error has occurred! Contact your SFDC admin for assistance.');
	        console.log('Query Error: ' + error);
	    }
	});
});

/**
* Example using the element bound method
**/
// Get reference to the button
var button = sfQuery('{!$Component.mainForm.mainBlock.mainSection.buttonId}');
// Call soql query action on click
button.soqlQuery({
	query: 'Select Id, Name from Account limit 10',
	success: function(result, state) {
		sfQuery('#spanElem').html('First account is: ' + result[0].Name);
	},
	error: function(error, source) {
        alert('An error has occurred! Contact your SFDC admin for assistance.');
        console.log('Query Error: ' + error);
    }
});
```

#####soqlQuery options
* query - The soql query to use.
* success - Callback function used for successful query result.
* error - Callback function used for unsuccessful query result.

###JS Remoting
*Javascript Remoting [Documentation](http://www.salesforce.com/us/developer/docs/pages/Content/pages_js_remoting.htm)*

Javascript remoting for VF/Apex allows you to bring the power of AJAX to your VF pages. The problem is the 
same issues that plague the sforce SOQL connection interface also plague the JS remoting interface. 
* Handling success and error conditions is not normalized and difficult
* The records in the response of the native remoting connection are not returned in a clean "query-list" way
* The syntax for remoting is confusing to read and prevents the creation of self documenting code

sfQuery has the *vfRemote()* method that allows you to easily make a remoting call. You can access this in a static context
in the *jQuery.SFQuery* namespace or with the element bound action method.

```JavaScript
/**
* Example using the static method
**/
// Get reference to the button
var button = sfQuery('{!$Component.mainForm.mainBlock.mainSection.buttonId}');
// Bind a remoting call to the onclick event
button.click(function() {
    jQuery.SFQuery.vfRemote({
        controller: 'PageControllerName', 
        methodName: 'remoteActionMethodName', 
        params: ['Epic', 'plugin!'],
        success: function(res, objInfo) {
            sfQuery('#spanElem').html(res);
        },
        error: function(e) {
            alert('Error with status code: ' + e.statusCode);
        }
    });
});

/**
* Example using the element bound method
**/
// Get reference to the button
var button = sfQuery('{!$Component.mainForm.mainBlock.mainSection.buttonId}');
// Make a remoting call on click
button.vfRemote({
	controller: 'PageControllerName', 
    methodName: 'remoteActionMethodName', 
    params: ['Epic', 'plugin!'],
    success: function(res, objInfo) {
        sfQuery('#spanElem').html(res);
    },
    error: function(e) {
        alert('Error with status code: ' + e.statusCode);
    }
});
```

#####vfRemote options
* controller - This is the name of your Visualforce controller.
* methodName - The name of the @remoteAction method in the controller.
* params - The parameters to pass to the remote action method. This can be a single parameter or an array.
* timeout - The AJAX request timeout (Default 30 seconds)
* success - Callback function used for successful remoting request result.
* error - Callback function used for unsuccessful remoting request result.
