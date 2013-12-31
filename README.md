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
----------------------
You can query for records using SOQL from the client side within a visualforce page using the *sforce* connection. 
This can be extremely useful in some situations however there are a couple of issues with it:
* Handling success and error conditions is not normalized and difficult
* The records in the response of the native sforce connection are not returned in a clean "query-list" way

Using the *soqlQuery()* method in sfQuery allows you to gracefully handle success and error conditions. 
It also returns the records to you formatted in the more common and useful "query-list result" way.
You can use the static method in the *jQuery.SFQuery* namespace or you can attach a soql query action to an element.

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
----------------------
*Javascript Remoting [Documentation](http://www.salesforce.com/us/developer/docs/pages/Content/pages_js_remoting.htm)*

Javascript remoting for VF/Apex allows you to bring the power of AJAX to your VF pages. The problem is the 
same issues that plague the sforce SOQL connection interface also plague the JS remoting interface. 
* Handling success and error conditions is not normalized and difficult
* The records in the response of the native remoting connection are not returned in a clean "query-list" way
* The syntax for remoting is confusing to read and makes it difficult to create self documenting code

sfQuery has the *vfRemote()* method that allows you to easily make a remoting call. You can access this in a static context
using the *jQuery.SFQuery* namespace or with the element bound action method.

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

###Autocomplete fields
----------------------
sfQuery makes it very simple to attach text auto-complete functionality to any input field on a VF page. As a user
begins typing, a list will appear matching the text of what the user has entered. You can use a SOQL query or remote action
method to get the data to display. You can also make it so that autocomplete is only triggered when it sees
a specfic keyword! Common examples of this are "@" mentions and hashtags in Chatter. When a user types "@" in Chatter, it
allows you to search for a user to mention in the post. Using sfQuery gives you this same functionality on any input field, with any
key combination (optional), and using any data objects you want!

Here is a simple example:
```Javascript
/**
* Let's attach traditional autocomplete functionality to 
* an apex:inputTextField
**/
sfQuery('{!$Component.mainForm.mainBlock.mainSection.inputFieldId}')
.sfAutoComplete({
	query: "select Id, Name from Account where Name like '%{v}%'",
    focusField: 'Id',
    inputFieldVal: 'Name',
    onRowClick: function(val) {
        alert('Clicked: ' + val);
    }
});
```
It's that easy! The example above shows the most simple way to add autocomplete to an input text field. 
You can see that we used a SOQL query to retrieve the data set. There is a special
identifier in the filter which is *{v}*. This string gets replaced with whatever value is in the
input text field. For example, if you type "Gene Point" into the text field, the resulting query 
will be *select Id, Name from Account where Name like '%Gene Point%'*. 
The resulting table would look like this:

| Id       | Name           | 
| :-------------: |:-------------:| 
| 000012345xcvbxzxee | Gene Point     | 
| 000012345xcvbxzxdx | McCarthy's Auto     | 


Here is a more advanced example using key combo autocomplete:
```Javascript
/**
* Let's attach key combo autocomplete functionality to 
* an apex:inputTextAreaField
**/
sfQuery('{!$Component.mainForm.mainBlock.mainSection.inputTextAreaFieldId}')
.sfAutoComplete({
	query: "Select Id, Name, Owner.Name, Owner.Alias, Owner.Email from Account where Name like '%{v}%'",
    focusField: 'Id',
    inputFieldVal: 'Name',
    combination: ';;',
    exclude: ['Id'],
    replace: {
        'Owner.Name': 'Owner Name',
        'Owner.Alias': 'Owner Alias',
        'Owner.Email': 'Owner Email'
    },
    onRowClick: function(val) {
        console.log('Clicked: ' + val);
    }
});
```
Here we see some new options. The first one is *combination*. This is the key combination used to initiate the
autocomplete search. When the user types ";;" and a search string, the request is made. We also see the *exclude*
and *replace* options. The exclude option tells the method to not show that field in the results table. The replace
option replaces the specified column name with a new string. This is usually used to make a more friendly 
looking table header. The resulting table would look like this:

| Name       | Owner Name           | Owner Alias  | Owner Email   |
| ------------- |:-------------:| :-----:|:---------:|
| Gene Point     | John Smith | jsmith | jsmith@email.com   |
| McCarthy's Auto     | Steve McCarthy | smccart | smccarthy@email.com   |


