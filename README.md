## ![alt text](https://github.com/sfQuery/prod/blob/master/icon.png?raw=true "sfQuery") sfQuery: jQuery plugin for [Salesforce.com](http://www.salesforce.com)
There's no arguing that jQuery is one of the most valuable javascript libraries available. The 
*sfQuery* plugin allows you to easily integrate jQuery with your Visualforce pages. It normalizes the way you query 
for elements in Visualforce. It also comes packed with functionality to ease the use of advanced Visualforce 
features like JS SOQL connections and JS remoting. The plugin is built on top of jQuery so you have access to everything
jQuery has to offer. All of this is merged into one plugin for SFDC!

**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*
- [ sfQuery: jQuery plugin for Salesforce.com](#-sfquery-jquery-plugin-for-salesforcecom)
	- [Installing the plugin](#installing-the-plugin)
	- [Querying elements](#querying-elements)
	- [JS SOQL connections](#js-soql-connections)
		- [soqlQuery options](#soqlquery-options)
	- [JS Remoting](#js-remoting)
		- [vfRemote options](#vfremote-options)
	- [Scrollable pageblock tables](#scrollable-pageblock-tables)
		- [tableScroll options](#tablescroll-options)
	- [Autocomplete fields](#autocomplete-fields)
		- [sfAutoComplete options](#sfautocomplete-options)
	- [Scenario questions](#scenario-questions)
		- [Javascript variable scope](#javascript-variable-scope)
		- [Using the rerender attribute](#using-the-rerender-attribute)

###Installing the plugin
----------------------
Using the plugin is as simple as including a single JS file and CSS file on your page. __NOTE__: jQuery 
is required. Please make sure to include it before the sfQuery JS file. jQuery 1.8+ is required.

The easiest thing to do is download the zip file and include the 2 files in the folder called "sfQuery_min_install".
Happy coding!!

###Querying elements
----------------------
Querying for DOM elements using jQuery is simple and powerful. Querying for elements in a Visualforce page using 
jQuery is a little more tricky. sfQuery simplifies this by allowing you to use the standard *$Component* object
just like you would use any other jQuery selector. It also excepts any valid jQuery query selector statement.

```JavaScript
// Example query selector using standard VF Component object
var elem = sfQuery('{!$Component.mainForm.mainBlock.mainSection.elementId}');

// Attaching events using a component reference
sfQuery('{!$Component.mainForm.mainBlock.mainSection.elementId}').click(function(e) {
	alert('Element clicked!');
});

// Since sfQuery runs on jQuery, you can use any valid jQuery selector as well!
// Getting references to standard HTML elements by their ID
var header = sfQuery('#headerId');

// Attaching a DOM ready listener
sfQuery(document).ready(function(e) {
	alert('Hello from sfQuery!');
});

// Attaching events to standard HTML elements
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

__NOTE:__ You must set the API session ID before calling the `soqlQuery()` method. The session ID can be retrieved
using `{!API.session_id}`:
```JavaScript
	sfQuery.setSessionId('{!API.session_id}');
```

`soqlQuery()` examples:
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

####soqlQuery options
* query - The soql query to use.
* success - Callback function used for successful query result.
* error - Callback function used for unsuccessful query result.
* before - Callback function called before query is executed
* finished - Callback function called after all query operations have completed. Called whether there is an error or not.

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

####vfRemote options
* controller - This is the name of your Visualforce controller.
* methodName - The name of the @remoteAction method in the controller.
* params - The parameters to pass to the remote action method. This can be a single parameter or an array.
* timeout - The AJAX request timeout (Default 30 seconds)
* success - Callback function used for successful remoting request result.
* error - Callback function used for unsuccessful remoting request result.

###Scrollable pageblock tables
----------------------
Tables are very easy to implment in VF. Like all tables however, when they become large they start
to impact the overall user experience of the page. With the `tableScroll()` method, you can enable scrolling 
on any table. This will set the height of the table to whatever you want it to be, then it 
will scroll up and down allowing the UI to remain clean and functional. The `tableScroll()` method 
will also fix the header to the top so the user won'thave to scroll up and down to remember what the columns were! 
You can  access this with the element bound action method.

Examples:
```Javascript

sfQuery('{!$Component.mainForm.mainBlock.mainSection.tableId}')
.tableScroll({
    height: 150
});
```
That's it! The table will be 150 pixels tall, and will scroll with a fixed header.

####tableScroll options
* height - The height for the scrolling table (in px)
* fixedHeader - Boolean option which tells the method to enable/disable a fixed, floating header. Default is true.

###Autocomplete fields
----------------------
sfQuery makes it very simple to attach text auto-complete functionality to any input field on a VF page. As a user
begins typing, a list will appear matching the text of what the user has entered. You can use a SOQL query or remote action
method to get the data to display. You can also make it so that autocomplete is only triggered when it sees
a specfic keyword! Common examples of this are "@" mentions and hashtags in Chatter. When a user types "@" in Chatter, it
allows you to search for a user to mention in the post. Using sfQuery gives you this same functionality on any input field, with any
key combination (optional), and using any data objects you want!

sfQuery has the `sfAutoComplete()` method that allows you to easily add autocomplete to an input text field. You can 
access this with the element bound action method.

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

A user can then scroll through the results and select one to populate the field. The *focusField* option
tells the method what field you want to get in the *onRowClick()* callback method. In this example, we are
getting the ID of whatever Account the user selected. The *inputFieldVal* option tells the method what
field should be used to populate the input field. In this example, the account Name will get
entered into the input text field when a user selects one.


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
| McCarthy's Auto     | Steve Jones | sjones | sjones@email.com   |

####sfAutoComplete options
* query - (Optional) The SOQL query used to retrieve the data set. If this is not set, a controller and methodName must be set.
* controller - (Optional) This is the name of your Visualforce controller. If this is not set, the query option must be set.
* methodName - (Optional) The name of the @remoteAction method in the controller. If this is not set, the query option must be set.
* onRowClick - (Optional) Callback function called when a user clicks a row in the table.
* focusField - The field which is passed to the onRowClick callback function.
* inputFieldVal - The field which populates the input text element when a user makes a selection.
* combination - (Optional) The key combination that the autocomplete action will look for before starting the search.
* exclude - (Optional) A list of fields to exclude from the result table view.
* replace - (Optional) An object mapping field -> replace text. The replace text will be put in place of the field name in the table header
* error - Callback function called when an error occurs with the request.

###Scenario questions
----------------------
Below are some scenarios in which special handling *may* be required (but not always). 

####Javascript variable scope
Javascript scoping can get tricky. There is a JS code pattern available to make sure your variables never conflict with global
vars already declared elswhere on the page. To properly scope your code, you should put all your javascript code in an 
anonymous function and pass the global vars that you want to use as parameters to the function. 

Example:
```Javascript
/**
* We will create an anonymous function and call it immediatly. Make sure to pass it all the 
* global vars you want to work with inside the function. In this case, we only pass the
* sfQuery object.
**/
(function($) {
	// Put all your code here
	// Instead of typing out "sfQuery()" everytime, now you can use the common
	// "$" var without worrying about conflicts. "$" now references the sfQuery function.
	$(document).ready(function() {
		// Put code here to be executed when the DOM is ready
	});
})(sfQuery);

// Another example where we pass sfQuery along with the window and document
// globals.
(function($, win, doc) {
	// Now "$" references the sfQuery function, win references the
	// window object and doc references the window.document object
	$(doc).ready(function() {
		// Put code here to be executed when the DOM is ready
	});
})(sfQuery, window, window.document);
```
Following this pattern will also vastly increase the efficiency of minifying your script files.

####Using the *rerender* attribute
The *rerender* attribute is available when using VF components like apex:commandbutton and apex:actionfunction. 
This will cause the request to only update parts of your page. If you have an sfQuery plugin action
bound to an element which has been re-rendered, you need to re-attach the action after the re-render 
is complete. 

The best practice for this is to put the action bindings into their own function and then call that
function when the re-render is complete. All elements that have the rerender attribute available
also have the *oncomplete* attribute. You can use this to execute javascript when the re-render
is complete. 

Here is a simple example:

(Visualforce)
```HTML
<apex:form id="mainForm">
	<apex:pageblock id="mainBlock">
		<apex:commandbutton 	id="theButton"
								action="{!refreshTable}"
								rerender="mainBlock"
								oncomplete="attachTableAction()"
		/>
		<apex:pageBlockTable id="simpleTable" value="{!accountList}" var="account">
	        <apex:column value="{!account.Id}"/>
	        <apex:column value="{!account.Name}"/>
	        <apex:column value="{!account.Owner.Name}"/>
	    </apex:pageBlockTable>
	</apex:pageblock>
</apex:form>
```
As you can see here, this is a simple page. There is a single button which calls the `refreshTable()` method
in the controller. This will cause VF to rerender the page block with ID "mainBlock". The issue is that we
have attached a `tableScroll()` action to the element using the sfQuery plugin. When the block is re-rendered
the action will no longer be bound to the table. We can get around this using the *oncomplete* attribute of
the command button. We will call the `attachTableActions()` method (below) which will re-bind the action to
the table. 

(Javascript)
```Javascript
(function($) {
	
	function attachTableAction() {
        $('{!$Component.mainForm.mainBlock.simpleTable}')
        .tableScroll({
            height: 150
        });
    }

    $(document).ready(function() {
    	// When DOM is ready, attach tableScroll action to table
    	attachTableAction();
    });

})(sfQuery);
```
That's it! You can see that we create a function called `attachTableAction()` which binds the `tableScroll` action
to the table. When initalize the table when the page is first loaded. Then, we call that function again using the
*oncomplete* attribute whenever the page is re-rendered.

