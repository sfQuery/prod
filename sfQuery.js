/**
* Function to get the cursor position wihin a text field
**/
(function ($, undefined) {
    $.fn.getCursorPosition = function() {
        var el = $(this).get(0);
        var pos = 0;
        if('selectionStart' in el) {
            pos = el.selectionStart;
        } else if('selection' in document) {
            el.focus();
            var Sel = document.selection.createRange();
            var SelLength = document.selection.createRange().text.length;
            Sel.moveStart('character', -el.value.length);
            pos = Sel.text.length - SelLength;
        }
        return pos;
    }
})(jQuery);

function sfQuery(str) {
    return jQuery.SFQuery.getVfElem(str);
}

// Set the session ID for AJAX API calls
sfQuery.setSessionId = function(id) {
    if(typeof sforce !== 'undefined') {
        sforce.connection.sessionId = id;
    }
};

function ApexScriptUtils() { 
    // Holds state for current autocomplete operation
    this.autoCompleteState = null;
    // Holds start position of cursor for auto complete
    this.acCursorStartPos = -1;
    // Stores typed char code for auto complete
    this.acCharCode = null;
    // Stores the query string for combination auto complete
    this.acQueryString = null;
    // Holds state of being in auto complete combination check
    this.acInCombination = false;
    // Holds state of being in auto complete query string
    this.acInQueryString = false;
    // Holds instance of key combination start window
    this.keyComboStartWindow = null;
}

// Holds the instance
ApexScriptUtils.instance = null;
// Holds callback functions for VF remoting
ApexScriptUtils.vfRemoteCallbacks = null;
// Default VF timeout (in sec)
ApexScriptUtils.defaultRemoteTimeout = 30;
// Timeout variable used
ApexScriptUtils.timeoutVar = null;

// Static namespace for functions
if(jQuery.SFQuery) {
    throw 'SFQuery already defined!';
}
jQuery.SFQuery = {};

ApexScriptUtils.getInstance = function() {
    if(ApexScriptUtils.instance === null) {
        ApexScriptUtils.instance = new ApexScriptUtils();
    }
    return ApexScriptUtils.instance;
};

// Static function used to initiate an alert if a visualforce 
// remoting call is taking too long.
ApexScriptUtils.alertDevFn = function() {
    alert('This remoting call is taking longer than expected.\n\n'
        + 'If you are a developer seeing this, please check the browser Javascript console for errors.\n'
        + 'If you are a user seeing this, please contact your Salesforce administrator.'
    );
};

ApexScriptUtils.getObjectInfo = function(obj) {
    // typeOf method returns a string like "[object TYPE]"
    // We replace all except for TYPE to make things easier
    var type = ApexScriptUtils.getSimpleType(obj);
    var result = {
            type: type
        }

    if(type == 'array') {
        result.length = obj.length;
    } else if(type == 'object') {
        var arr = [];
        for(key in obj) {
            arr.push(key);
        }
        result.fields = arr;
    } 
    return result;
};

// Static method used to return a more exact description of an object
// Return values are like "[object Object]" or "[object Array]"
ApexScriptUtils.typeOf = Function.prototype.call.bind( Object.prototype.toString );

ApexScriptUtils.getSimpleType = function(obj) {
    return ApexScriptUtils.typeOf(obj)
                .replace('[object ', '')
                .replace(']', '')
                .toLowerCase();
};

ApexScriptUtils.prototype.doVfRemoteCall = function(className, method, params, callbacks) {
    var raString = className + '.' + method;
    ApexScriptUtils.vfRemoteCallbacks = callbacks;
    // Set the timeout check alert
    // This is used to alert the developer that the 
    // request is taking a while and to check the console
    // for error messages
    ApexScriptUtils.timeoutVar = setTimeout(
        ApexScriptUtils.alertDevFn, 
        ApexScriptUtils.defaultRemoteTimeout  / 2 * 1000
    );

    // The invokeAction method can throw "Un-catchable" errors
    // The errors are un-catchable because Salesforce does not
    // throw Javascript exceptions when these conditions are encountered,
    // they just log them to the console and otherwise fail silently.
    // Some of the errors include if the developer puts a
    // non existent class or method in the remoting call
    // To get around this, the timer set above will alert the
    // developer if the remote call doesn't return in a set
    // amount of time.
    var args = [];
    args.push(raString);
    if(ApexScriptUtils.getSimpleType(params) === 'string') {
        args.push(params);
    } else {
        args = args.concat(params);
    }
    args.push(ApexScriptUtils.prototype.handleRemoteCallback.bind(this));
    // Call remoting invokeAction method within context of the Manager object
    // This is done because the invokeAction method accepts a variable amount 
    // of parameters.
    Visualforce.remoting.Manager.invokeAction.apply(Visualforce.remoting.Manager, args);
};

ApexScriptUtils.prototype.handleRemoteCallback = function(result, event) {
    // Clear dev alert timeout var
    clearTimeout(ApexScriptUtils.timeoutVar);
    if(event.status === true) {
        var objInfo = ApexScriptUtils.getObjectInfo(result);
        ApexScriptUtils.vfRemoteCallbacks.success(result, objInfo);
    } else {
        ApexScriptUtils.vfRemoteCallbacks.error(event);
    }
};

/**
* Returns a default extend object for the VF remoting method
* @return Object
**/
ApexScriptUtils.getRemotingExtend = function() {
    return jQuery.extend({
                controller: null,
                methodName: null,
                params: null,
                timeout: ApexScriptUtils.defaultRemoteTimeout,
                success: function(res, objInfo) {
                    alert('Default success handler invoked. Check console for more info.');
                    console.log(res);
                    console.log(objInfo);
                },
                error: function(result) {
                    alert('Default error handler invoked. Check console for more info.');
                    console.log(result);
                }
            }, 
            arguments[0] || {}
        );
};

jQuery.fn.vfRemote = function() {
    // extend the options from pre-defined values:
    var options = ApexScriptUtils.getRemotingExtend(arguments[0]);

    return this.each(function() {
        jQuery(this).click(function() {
            ApexScriptUtils.getInstance().doVfRemoteCall(
                options.controller, 
                options.methodName, 
                options.params, 
                {
                    success: options.success,
                    error: options.error
                }
            );
        });
    });
};

// Create the static version of VF remote call
jQuery.SFQuery.vfRemote = function() {
    // extend the options from pre-defined values:
    var options = ApexScriptUtils.getRemotingExtend(arguments[0]);

    ApexScriptUtils.getInstance().doVfRemoteCall(
        options.controller, 
        options.methodName, 
        options.params, 
        {
            success: options.success,
            error: options.error
        }
    );
};

ApexScriptUtils.getQueryExtend = function() {
    return jQuery.extend({
                query: null,
                success: function(result, source) {
                    alert('Default success handler invoked. Check console for more info.');
                    console.log(result);
                },
                error: function(error, source) {
                    alert('Default error handler invoked. Check console for more info.');
                    console.log('Query Error: ' + error);
                }
            }, 
            arguments[0] || {}
        );
};

ApexScriptUtils.prototype.query = function() {
    var options = ApexScriptUtils.getQueryExtend(arguments[0]);

    var state = {
        success: options.success,
        error: options.error
    };
    
    sforce.connection.query(
                        options.query, 
                        {
                            onSuccess: ApexScriptUtils.prototype.handleQueryResult.bind(this), 
                            onFailure: ApexScriptUtils.prototype.handleQueryResult.bind(this),
                            //state that you need when the callback is called
                            // This is optional. You can use this to manage state between calls.
                            source: state
                        }
    );
};

ApexScriptUtils.prototype.handleQueryResult = function(result, state) {
    // Since failure and success callbacks are seperated in the SFDC 
    // AJAX API there is no error flag available. If the error handler
    // should be called, the "result" param will be a string type or
    // it will be an object with faultstring set 
    if(ApexScriptUtils.getSimpleType(result) == 'object' 
        && typeof result.faultstring === 'undefined') {
        if(result.done == 'true') {
            state.success(this.cleanQueryResult(result.getArray('records')));
        } else {
            // The batch is large and we need to query more
            // Continue to query more then return all records
            var fullRecordList = result.getArray('records');
            var done = false;
            while(!done) {
                var moreRecords = sforce.connection.queryMore(result.queryLocator);
                done = moreRecords.done;
                var recordArray = moreRecords.getArray('records');
                for(var i = 0; i < recordArray.length; i++) {
                    fullRecordList.push(recordArray[i]);
                }
            }
            state.success(this.cleanQueryResult(fullRecordList));
        }
    } else if (typeof result.faultstring !== 'undefined') {
        state.error(result.faultstring);
    } else {
        state.error(result);
    }
};

/**
* The query result from SFDC has extra data like functions.
* This method removes any functions from the result
**/
ApexScriptUtils.prototype.cleanQueryResult = function(results) {
    var cleanList = [];
    var relatedObjList = [];
    for(var i = 0; i < results.length; i++) {
        var curr = results[i];
        var cleanObj = {};
        for(var key in curr) {
            var type = ApexScriptUtils.getSimpleType(curr[key]);
            // SFDC query api adds a "type" property to the results
            // Remove that as well
            if(type != 'function' && key !== 'type') {
                
                if(type != 'object') {
                    cleanObj[key] = curr[key];  
                } else {
                    // This is a related object field
                    // First we clean the related objects by stripping
                    // out anything that isn't a primitive type (such as functions)
                    // Then we flatten the object structure into the final object
                    var relatedObj = {};
                    relatedObj[key] = this.parseRelatedObject(curr[key]);
                    relatedObjList.push(relatedObj);

                    var outObj = {};
                    this.parseObjectsForTable(relatedObj, null, outObj);
                    for(relField in outObj) {
                        cleanObj[relField] = outObj[relField];
                    }
                }
            } 
        }
        cleanList.push(cleanObj);
    }
    return cleanList;
};

/**
* Parses object responses recursively to find the end value and name
**/
ApexScriptUtils.prototype.parseRelatedObject = function(obj) {
    var dataObj = {};

    for(key in obj) {
        var type = ApexScriptUtils.getSimpleType(obj[key]);
        if(key != 'Id' && key != 'type' && type != 'function') {
            if(type != 'object') {
                dataObj[key] = obj[key];
            } else {
                dataObj[key] = this.parseRelatedObject(obj[key]);
            }
        }
    }
    return dataObj;
};

ApexScriptUtils.prototype.parseObjectsForTable = function(obj, currName, outObj) {
    currName = (typeof currName !== 'undefined' ? currName : null);
    // Base case is where value is not an object
    // If value is an object, append key and call with next child
    for(key in obj) {
        var type = ApexScriptUtils.getSimpleType(obj[key]);
        var fieldName = (currName != null ? currName + '.' + key : key);
        if(type != 'object') {
            outObj[fieldName] = obj[key];
        } else {
            this.parseObjectsForTable(obj[key], fieldName, outObj);
        }
    }
};

jQuery.SFQuery.soqlQuery = function() {
    ApexScriptUtils.getInstance().query(arguments[0]);
};

jQuery.fn.soqlQuery = function() {
    var args = arguments[0];
    return this.each(function() {
        jQuery(this).click(function() {
            ApexScriptUtils.getInstance().query(args);
        });
    });
};

ApexScriptUtils.jqEsc = function(id) {
    if(!id) {
        return '';
    }

    // Handle SFDC Id's
    // They always begin with a unique form identifier starting with "j_id"
    if(id.substr(0, 4) === 'j_id') {
        return '[id="' + id + '"]';
    }
    
    // Default to the original ID for jQuery to handle
    return id;
};

ApexScriptUtils.prototype.jQuery = function(selector) {
    var type = ApexScriptUtils.getSimpleType(selector);
    switch(type) {
        case 'string': return jQuery(ApexScriptUtils.jqEsc(selector));
        default: return jQuery(selector);
    }
};

jQuery.SFQuery.getVfElem = function(vfId) {
    return ApexScriptUtils.getInstance().jQuery(vfId);
};

ApexScriptUtils.prototype.doSearchForAutoComplete = function(params) {
    if(params.obj.val() == '') {
        this.hideAutoCompleteWindow();
        return;
    }
    
    var options = ApexScriptUtils.getAutoCompleteExtend(params.args);

    var state = {
        elem: params.obj,
        onRowClick: options.onRowClick,
        focusField: options.focusField,
        inputFieldVal: options.inputFieldVal,
        replace: options.replace,
        exclude: options.exclude
    };
    this.autoCompleteState = state;

    this.showAutoCompleteLoad();

    if(options.controller != null && options.methodName != null) {
        jQuery.SFQuery.vfRemote({
            controller: options.controller,
            methodName: options.methodName,
            params: [params.obj.val().trim()],
            success: options.success
        });
    } else {
        jQuery.SFQuery.soqlQuery({
            query: options.actualQuery,
            success: options.success
        });
    }
};

ApexScriptUtils.prototype.showAutoCompleteResults = function(results) {
    if(results === null || results.length === 0) {
        // Set focus back to input and return
        this.autoCompleteState.elem.focus();
        this.showNoResultsWindow();
        return;
    }

    var table = this.getAutoCompleteTable(this.cleanQueryResult(results), this.autoCompleteState);
    jQuery('#sf-ac-res-wind')
        .empty()
        .append(table);
    this.showAutoCompleteWindow(this.autoCompleteState.elem);
    // Add focus to the table for navigation
    table.focus();
    // Scroll top so header is visible
    table.parent().scrollTop(0);
};

ApexScriptUtils.prototype.hideAutoCompleteWindow = function() {
    jQuery('#sf-ac-res-wind').empty().hide();
};

ApexScriptUtils.prototype.showAutoCompleteLoad = function() {
    jQuery('#sf-ac-res-wind')
        .empty()
        .append('<span>Loading...</span>');
    this.showAutoCompleteWindow(this.autoCompleteState.elem);
};

ApexScriptUtils.prototype.showNoResultsWindow = function() {
    jQuery('#sf-ac-res-wind')
        .empty()
        .append('<span style="font-weight: bold; margin: 2px;">No results found.</span>');
    this.showAutoCompleteWindow(this.autoCompleteState.elem);
};

ApexScriptUtils.prototype.showAutoCompleteWindow = function(elem) {
    var acWind = jQuery('#sf-ac-res-wind');
    acWind.css({
        top: elem.offset().top + elem.outerHeight() + 5,
        left: elem.offset().left + 1
    });
    acWind.fadeIn();
};

ApexScriptUtils.prototype.setElemVal = function(elem, val) {
    // If we are working with a key combo query, replace the
    // key combo and query text with the value
    // If not, just add the value to the element's value
    if(elem.val().length > 0 && this.acInQueryString) {
        var totalStr = this.acCharCode + this.acQueryString;
        var regex = new RegExp('(' + totalStr + ')', 'gi');
        elem.val(elem.val().replace(regex, val));
    } else {
        elem.val(val);
    }
};

ApexScriptUtils.prototype.scrollAcWindForNav = function(elem) {
    var parentWind = jQuery('#sf-ac-res-wind');
    var top = elem.position().top;
    jQuery(parentWind).animate({scrollTop: top}, 100);
};

ApexScriptUtils.prototype.handleAutoCompleteTableNav = function(e, table) {
    var currRow = table.find('.sfquery-ac-table-row-hover');
    var index = table.data('focusedRowIndex');
    var numRows = table.find('tr').length;

    // Arrow up
    if (e.keyCode == 38) { 
        if(index === 2) {
            // At the top row already
            return false;
        }
        table.data('focusedRowIndex', --index);
        currRow.removeClass('sfquery-ac-table-row-hover');
        var prevRow = table.find('tbody tr:nth-child(' + index + ')');
        prevRow.addClass('sfquery-ac-table-row-hover');
        if(index === 2) {
            // At top row, scroll header into view
            table.parent().scrollTop(0);
        } else {
            this.scrollAcWindForNav(prevRow);
        }
        
        return false;
    }
    // Arrow down
    if (e.keyCode == 40) { 
        if(index === numRows) {
            // At the bottom
            return false;
        }
        table.data('focusedRowIndex', ++index);
        currRow.removeClass('sfquery-ac-table-row-hover');
        var nextRow = table.find('tbody tr:nth-child(' + index + ')');
        nextRow.addClass('sfquery-ac-table-row-hover');
        this.scrollAcWindForNav(nextRow);
        return false;
    }
    // ENTER, SPACE or TAB key
    if (e.keyCode == 13 || e.keyCode == 32 || e.keyCode == 9) { 
       currRow.click();
       return false;
    }
};

ApexScriptUtils.prototype.scrollInputToBottom = function(input) {
    input.scrollTop(input[0].scrollHeight);
    input.focus();
};

ApexScriptUtils.prototype.getAutoCompleteTable = function(resList, state) {
    var _self = this;
    var table = jQuery('<table></table>');
    table.attr('tabindex', 0);
    table.data('focusedRowIndex', 2);

    // Add navigation
    table.keydown(function(e) {
        e.preventDefault();
        e.stopPropagation();
        _self.handleAutoCompleteTableNav(e, jQuery(this));
    });

    table.addClass('sfquery-ac-table');
    var tableBody = jQuery('<tbody></tbody>');

    // Create header row
    var fieldList = [];
    var headerRow = jQuery('<tr></tr>');

    // Create a field result object
    // This object contains information about the state of the field
    // If the value is false, it was excluded, else it is displayed
    var fieldStates = {};
    for(var field in resList[0]) {
        fieldList.push(field);
        fieldStates[field] = true;
        if(jQuery.inArray(field, state.exclude) > -1) {
            fieldStates[field] = false;
            continue;
        } else if(field in state.replace) {
            headerRow.append("<th>" + state.replace[field] + "</th>");
        } else {
            headerRow.append("<th>" + field + "</th>");
        }
    }
    tableBody.append(headerRow);

    var firstColName = fieldList[0];
    var inputVal = null;
    for(var i = 0; i < resList.length; i++) { // Main row loop
        var newRow = jQuery('<tr></tr>');
        var firstColValue = resList[i][firstColName];
        if(state.inputFieldVal != null
            && typeof resList[i][state.inputFieldVal] !== 'undefined') {
            inputVal = resList[i][state.inputFieldVal];
        } else {
            inputVal = firstColValue;
        }

        for(var k = 0; k < fieldList.length; k++) { // Main field loop
            var fieldVal = resList[i][fieldList[k]];
            // Check if ths is the focus field and init onclick
            // listener
            if(fieldList[k] == state.focusField) {
                // Add onclick function
                newRow.click(function(val, iVal) {
                    return function() {
                        _self.hideAutoCompleteWindow();
                        _self.setElemVal(state.elem, iVal);
                        _self.resetAutoCompleteVars();
                        _self.scrollInputToBottom(state.elem);
                        state.onRowClick(val);
                    }
                }(fieldVal, inputVal));
            }

            if(fieldStates[fieldList[k]] === false) {
                // Exclude this field from view
                continue;
            }

            newRow
            .append('<td>' + fieldVal + '</td>')
            .focus(function() {
                jQuery(this).addClass('sfquery-ac-table-row-hover');
            })
            .blur(function() {
                jQuery(this).removeClass('sfquery-ac-table-row-hover');
            })
            .mouseover(function() {
                jQuery(this).addClass('sfquery-ac-table-row-hover');
            })
            .mouseout(function() {
                jQuery(this).removeClass('sfquery-ac-table-row-hover');
            });
            
        }  

        if(i === 0) {
            newRow.addClass('sfquery-ac-table-row-hover');
        } 
        tableBody.append(newRow);
    }

    table.append(tableBody);
    return table;
};

ApexScriptUtils.getAutoCompleteExtend = function() {
    return jQuery.extend({
                query: null,
                actualQuery: null, // Query after replace
                controller: null,
                methodName: null,
                type: 'inputText', // inputField for sObject coupled fields
                state: null,
                onRowClick: null, // Function to call when a row is clicked on
                focusField: null, // Field from the result set that will be passed to the function
                inputFieldVal: null, // Field from the result set that will populate the input field
                combination: null, // String combination to look for before initiating query
                replace: {}, // Object containing a field name --> replacement field name
                exclude: [], // List of fields to exclude from the table
                success: ApexScriptUtils.prototype.showAutoCompleteResults.bind(ApexScriptUtils.getInstance()),
                error: function(error, source) {
                    alert('Default error handler invoked. Check console for more info.');
                    console.log(error);
                }
            }, 
            arguments[0] || {}
        );
};

ApexScriptUtils.prototype.resetAutoCompleteVars = function() {
    this.hideKeyComboStart();
    this.hideAutoCompleteWindow();
    this.acInQueryString = false;
    this.acInCombination = false;
    this.acQueryString = null;
    this.acCharCode = null;
};

ApexScriptUtils.prototype.createAutoCompleteWindow = function() {
    var newResWind = jQuery('<div id="sf-ac-res-wind"/>');
    newResWind.css({
        position: 'absolute',
        display: 'none',
        top: 0,
        left: 0,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #AAA'
    });
    jQuery(document.body).append(newResWind);
    return newResWind;
};

ApexScriptUtils.prototype.showKeyComboStart = function(elem) {
    var keyComboStartWind = this.getKeyComboStartElem(elem);
    keyComboStartWind.css({
        position: 'absolute',
        top: elem.offset().top + elem.height() + 1,
        left: elem.offset().left + 5
    });
    keyComboStartWind.show();
};

ApexScriptUtils.prototype.hideKeyComboStart = function(elem) {
    var keyComboStartWind = this.getKeyComboStartElem(elem);
    keyComboStartWind.hide();
};

ApexScriptUtils.prototype.getKeyComboStartElem = function() {
    if(this.keyComboStartWindow == null) {
        var wind = jQuery('<div class="key-combo-start-window"/>');
        wind.append(jQuery('<span>Begin typing to search</span>'));
        this.keyComboStartWindow = wind;
        jQuery(document.body).append(wind);
    }
    return this.keyComboStartWindow;
};

ApexScriptUtils.prototype.acOnKeyDown = function(params, elem, keyEvent) {
    if(elem.data('timeout') != null) {
        clearTimeout(elem.data('timeout'));
    }

    // If the element is empty, just reset state
    if(elem.val().length === 0) {
        this.resetAutoCompleteVars();
        return;
    }

    var keyCode = keyEvent.which || keyEvent.keyCode;
    var charFromCode = this.mapKeyCode(keyEvent.shiftKey, keyCode);
    // charFromCode can be undefined if only a control/shift/command key 
    // was pressed
    // This can also be an escaped char such as \r for newline
    if(!this.isPrintableChar(keyCode) || typeof charFromCode === 'undefined') {
        return;
    }
    // Keeps track of wether we should initiate the request or not
    // This will be false when working with key combinations
    var sendReq = true;

    // If the char combination is set, look for it before
    // starting search
    if(params.args.combination != null && !this.acInQueryString) {
        // Get cursor position
        // Search text behind cursor position for the char code.
        var combo = params.args.combination;
        var elemVal = elem.val();

        // User hit backspace
        if(keyCode === 8) {
            if(this.acCharCode.length == 1) {
                // Just reset all vars and leave char combo state
                this.resetAutoCompleteVars();
            } else {
                // Pop last character off of char code
                this.acCharCode = this.acCharCode.substr(0, this.acCharCode.length - 1);
            }

            this.hideKeyComboStart();
            return;
        }

        if(this.acCharCode == null) {
            // The combination has not been set yet
            this.acCursorStartPos = elem.getCursorPosition();
            var cursorIndex = this.acCursorStartPos - 1;

            if(charFromCode == combo.substr(0, 1)) {
                this.acCharCode = charFromCode;
                // If the combination is only one char and matches, set the next
                // state to true
                if(this.acCharCode === combo) {
                    this.acInQueryString = true;
                    this.showKeyComboStart(elem);
                }
            }
        } else {
            // Append the current key to the char code list
            this.acCharCode += charFromCode;
            if(this.acCharCode === combo) {
                this.acInQueryString = true;
                this.showKeyComboStart(elem);
            }
        }

        sendReq = false;

    } else if(this.acInQueryString) {
        // User hit backspace
        if(keyCode == 8) {
            // Pop last character off of query
            // This can be null if the user hits backspace right after
            // typing the key combo
            if(this.acQueryString == null) {
                // If the char code is only 1 character, then it was
                // just erased. Reset full state
                if(this.acCharCode.length === 1) {
                    this.resetAutoCompleteVars();
                } else {
                    // Set state back to before typing in key combo
                    // and remove an item from the char code string
                    this.acInQueryString = false;
                    this.acCharCode = this.acCharCode.substr(0, this.acCharCode.length - 1);
                }
                this.hideKeyComboStart();
                sendReq = false;
            } else {
                if(this.acQueryString.length > 1) {
                    this.acQueryString = this.acQueryString.substr(0, this.acQueryString.length - 1);
                } else {
                    this.acQueryString = null;
                    this.showKeyComboStart(elem);
                    this.hideAutoCompleteWindow();
                    sendReq = false;
                }
            }
        } else if(this.acQueryString == null) {
            this.acQueryString = charFromCode;
        } else {
            this.acQueryString += charFromCode;
        }
    }

    var _self = this;
    if(sendReq) {
        var tHandle = setTimeout(function() {
            params.obj = elem;
            _self.hideKeyComboStart();
            var actualQuery = null;
            if(typeof params.args.query !== 'undefined') {
                // Replace all instances of "{v}" 
                // Instances are replaced with the full value of the input field
                // unless there is a defined auto complete query set
                if(!_self.acInQueryString) {
                   actualQuery = params.args.query.replace(/\{v\}/g, elem.val());
                } else {
                    actualQuery = params.args.query.replace(/\{v\}/g, _self.acQueryString);
                }
            }
            params.args.actualQuery = actualQuery;
            ApexScriptUtils.getInstance()
                        .doSearchForAutoComplete(params);
        }, 700);
        elem.data('timeout', tHandle);
    }
};

ApexScriptUtils.prototype.isPrintableChar = function(charCode) {
    return (
        /* SHIFT key */
        charCode != 16 &&
        /* CNTRL key */
        charCode != 17 &&
        /* ALT key */
        charCode != 18 &&
        /* COMMAND key */
        charCode != 91
    );
};

ApexScriptUtils.prototype.mapKeyCode = function(isShiftKey, keyCode) {
    // Because we are using keydown instead of keypress it does
    // not natively handle converting key codes if the shift key
    // is pressed so we do it manually.

    var characterMap = [];
    characterMap[192] = "~";
    characterMap[49] = "!";
    characterMap[50] = "@";
    characterMap[51] = "#";
    characterMap[52] = "$";
    characterMap[53] = "%";
    characterMap[54] = "^";
    characterMap[55] = "&";
    characterMap[56] = "*";
    characterMap[57] = "(";
    characterMap[48] = ")";
    characterMap[109] = "_";
    characterMap[107] = "+";
    characterMap[219] = "{";
    characterMap[221] = "}";
    characterMap[220] = "|";
    characterMap[59] = ":";
    characterMap[222] = "\"";
    characterMap[188] = "<";
    characterMap[190] = ">";
    characterMap[191] = "?";
    characterMap[32] = " ";

    var character = '';
    if (isShiftKey) {
        if ( keyCode >= 65 && keyCode <= 90 ) {
            character = String.fromCharCode(keyCode);
        } else {
            character = characterMap[keyCode];
        }
    } else {
        // SPECIAL CASE
        // A semicolon (;) in FF is keycode 59 where in other
        // browsers it's 186. Manually check for this and convert
        if(keyCode == 186 || keyCode == 59) {
            character = ';';
        }else if ( keyCode >= 65 && keyCode <= 90 ) {
            character = String.fromCharCode(keyCode).toLowerCase();
        } else {
            character = String.fromCharCode(keyCode);
        }
    }
    return character;
};

jQuery.fn.sfAutoComplete = function() {
    var acResWind = jQuery('#sf-ac-res-wind');
    if(acResWind.length == 0) {
        ApexScriptUtils.getInstance().createAutoCompleteWindow();
    }
    var args = arguments[0];
    var params = {args: args};
    return this.each(function() {
        jQuery(this).keyup(function(e) {
            ApexScriptUtils.getInstance().acOnKeyDown(params, jQuery(this), e);
        }); 
                 
    });

};

ApexScriptUtils.getTableScrollExtend = function(options) {
    return jQuery.extend({
                fixedHeader: true,
                height: 400
            }, 
            arguments[0] || {}
        );
};

ApexScriptUtils.prototype.tableScroll = function(table, options) {
    // Wrap table in a div container
    // Make table header pos absolute to the top
    table.wrap('<div class="sfquery-float-table-wrapper"/>');
    var wrapper = table.parent();
    wrapper.css({
        overflow: 'auto',
        height: options.height + 'px'
    });

    if(options.fixedHeader) {
        var fixedHeaderCont = jQuery('<div class="sfquery-float-table-header-cont"/>');
        this.addTableHeaderToFixedCont(fixedHeaderCont, table);
        wrapper.append(fixedHeaderCont);

        wrapper.scroll(function() {
            var newPos = jQuery(this).scrollTop();
            fixedHeaderCont.css({
                top: newPos
            });
            if(newPos === 0) {
                fixedHeaderCont.hide();
            } else if(!fixedHeaderCont.is(':visible')) {
                fixedHeaderCont.show();
            }
        });
    }

    
};

ApexScriptUtils.prototype.addTableHeaderToFixedCont = function(headerCont, table) {
    var headerTable = table.clone();
    headerTable.children('tbody').remove();
    // Adjust table header sizes
    var floatingCols = headerTable.find('thead > tr > th');
    table.find('thead > tr > th').each(function(index, elem) {
        var fullCol = jQuery(elem);
        var cloneCol = jQuery(floatingCols[index]);
        cloneCol.width(fullCol.width());
    });

    headerCont.append(headerTable);
};

jQuery.fn.tableScroll = function(tableOpt) {
    var options = ApexScriptUtils.getTableScrollExtend(tableOpt);
    return this.each(function() {
        ApexScriptUtils.getInstance().tableScroll(jQuery(this), options);
    });
};