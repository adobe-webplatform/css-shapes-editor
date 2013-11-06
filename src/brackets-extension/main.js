/*
 * Copyright (c) 2013 Adobe Systems Incorporated.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

define(function (require, exports, module) {
    "use strict";

    var DocumentManager     = brackets.getModule("document/DocumentManager"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        Menus               = brackets.getModule("command/Menus"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        AppInit             = brackets.getModule("utils/AppInit"),
		Dialogs             = brackets.getModule("widgets/Dialogs"),
		DefaultDialogs      = brackets.getModule("widgets/DefaultDialogs"),
	    LiveDevelopment     = brackets.getModule("LiveDevelopment/LiveDevelopment"),
	    Inspector           = brackets.getModule("LiveDevelopment/Inspector/Inspector");
		
	// ignore
	function ignore(v){ if(v && v.wasThrown) console.dir(v); }
	
	// some variables
	var currentEditor = EditorManager.getActiveEditor();
    var currentEditorUpdater = 0; var prefix="-webkit-";
	
	var currentRule = "";
	var currentProperty = "";
	var currentPropertyValue = "";
	var currentPropertyRange = null;
	var currentPropertyValueRange = null;
	
	function Range_isInRange(newRange, oldRange) {
		
		// sanity checks
		if(!newRange || !oldRange) return false;
		
		// check that the new start isn't before the old start
		if(newRange.start.line < oldRange.start.line) return false;
		if(newRange.start.line == oldRange.start.line) {
			if(newRange.start.ch < oldRange.start.ch ) return false;
		}
		
		// check that the old end isn't before the new start
		if(oldRange.end.line < newRange.end.line) return false;
		if(oldRange.end.line == newRange.end.line) {
			if(oldRange.end.ch < newRange.end.ch ) return false;
		}
		
		// it seems it's ok now
		return true;
		
	}
	
	// some callbacks
	var onEditorChanged = function() {
		
		// clean old hooks
		if(currentEditor) { 
			$(currentEditor).off("cursorActivity", onSelectionChanged) 
			$(currentEditor).off("change", onContentChanged) 
		}
		
		// update the values
		currentEditor = EditorManager.getActiveEditor();
		resetLivePreview();
		
		// add new hooks
		if(currentEditor) { 
			$(currentEditor).on("cursorActivity", onSelectionChanged)
			$(currentEditor).on("change", onContentChanged) 
		}
		
	}
	var onSelectionChanged = function() {
				
        // abort if we don't have any editor ready anyway
        if(!currentEditor) return;
        
		// abort if the livedev isn't open anyway
		if(LiveDevelopment.status !== LiveDevelopment.STATUS_ACTIVE) {
            if(LiveDevelopment.status !== LiveDevelopment.STATUS_OUT_OF_SYNC) return;
        }
		
		// extract the selection
		var selection = currentEditor.getSelection();
		
		// abort if we're still in the previous range
		if(selection && Range_isInRange(selection,currentPropertyRange)) return;
		
		// close the shape editor if we moved away from the range
		editor_stopEditing()
		
		// detect the new shape range, if any
		detectShapeProperty()
		
		// open the shape editor if we are in a new valid range
		if(currentRule) {
			var selector = currentRule || "*"; 
            var property = currentProperty || "shape-inside";
			editor_startEditing(selector,property,currentPropertyValue);
		} else {
		    editor_stopEditing();
		}
		
	}
	var onContentChanged = function() {
		
		// we have to check the current rule/property didn't change
        var activeRule = currentRule;
        var activeProperty = currentProperty;
        var activePropertyValue = currentPropertyValue;
        detectShapeProperty();
		
		if(currentRule !== activeRule || currentProperty !== activeProperty) {

			// if they did
			editor_stopEditing();
            resetLivePreview();

		} else {
			
			// if they didn't we need to update the ranges (done)
			// we may also need to update the shape editor
            if(currentPropertyValue != activePropertyValue) {
				
				// if the change was triggered by the user, fuck you
				if(!EditorManager.getFocusedEditor()) return;
				else editor_updateValue(currentPropertyValue);
				
            }			
		}
		
	}
	
	function detectShapeProperty() {
		//var prptyDeclarationFinder = (/-?[a-z]*-?(shape-inside|shape-outside|clip-path|width|height)\s*\:([^";}]*)/g);
		var prptyDeclarationFinder = (/-?[a-z]*-?(shape-inside|shape-outside|clip-path)\s*\:([^";}]*)/g);
		var endOfDeclarationFinder = (/(\n( |\t)*)?([-a-zA-Z0-9]+\s*\:([^";}]*)([";}]?\s*))$/);
        var commentFinder = (/(\n( |\t)*)?((\/\*)([^*]|\*[^\/])(\*)?(\*\/)?(\s*))+$/);
		
		function expandSelection(doc, lineNumber) {
			var startsByBreaker = /^\s*(;|\{|\}|\")/;
			var containsBreaker = /(;|\{|\}|\")/;
			var endsByBreaker = /(;|\{|\}|\")\s*$/;
			
			var stringValue = doc.getLine(lineNumber);
			var startLineNumber = lineNumber;
			var endLineNumber = lineNumber;
			
			// expand by adding previous lines
			if(lineNumber != 0) {
				var currentLine = doc.getLine(lineNumber);
				if(!startsByBreaker.test(currentLine)) {
					do {
						
						// grab some content to add
						var previousLine = doc.getLine(startLineNumber-1);
						
						// do not add a line if it's a no-op
						if(endsByBreaker.test(previousLine)) {
							break;
						}
						
						// go to next line
						startLineNumber -= 1;
						currentLine = previousLine;
						stringValue = currentLine + "\n" + stringValue;
						
					} while(!(containsBreaker.test(currentLine)) && (startLineNumber != 0))
				}
			}
			
			// expand by adding subsequent lines
			if(lineNumber != -1) {
				var currentLine = doc.getLine(lineNumber);
				if(!endsByBreaker.test(currentLine)) {
					do {
						
						// grab some content to add
						var nextLine = doc.getLine(endLineNumber+1);
						
						// do not add a line if it's a no-op
						if(nextLine===undefined || startsByBreaker.test(nextLine)) {
							break;
						}
						
						// go to next line
						endLineNumber += 1;
						currentLine = nextLine;
						stringValue = stringValue + "\n" + currentLine;
						
					} while(!(containsBreaker.test(currentLine)) && (startLineNumber != -1))
				}
			}
			
			return { startLine: startLineNumber, endLine: endLineNumber, stringValue: stringValue };
			
		}
        
        function findRule(doc, pos) {
			
            var lineNumber = pos.line; 
            var currentLine = doc.getLine(lineNumber).substr(0,pos.ch);
            
            // add previous lines until you find an open brace
            var lineContent = currentLine;
            while(currentLine.indexOf("{") <= 0) {
                currentLine = doc.getLine(--lineNumber);
                lineContent = currentLine + ' ' + lineContent;
            }
            
            // add previous lines until you find a closing brace
            if(currentLine.indexOf("}") < 0 || currentLine.lastIndexOf("}") > currentLine.lastIndexOf("{")) {
                
                do {
                    currentLine = doc.getLine(--lineNumber);
                    lineContent = currentLine + ' ' + lineContent;
                } while(currentLine.indexOf("}") < 0);
                
            }
            
            // extract the rule's selector
            var selectorFinder = /((\s|[-,a-zA-Z0-9_.#:<>+~=\(\)\[\]@!?]|\"([^"]|\\\")*\"|\'([^']|\\\')*\')*)\{[^{]*$/;
            
            var infos = null;
            if(infos=selectorFinder.exec(lineContent)) {
				var selector = infos[1];
				var selector = selector.replace(/^\s+/,'').replace(/\s+$/,'');
				var selector = selector.replace(/\s+/g, ' '); // It could be wrong, but I don't care
                return selector;
            } else {
                return "*";
            }
            
        }
		
		function convertToLinePos(startPos, string, objectToUpdate) {
			
			var lines = string.split('\n');
			var lineOffset = lines.length - 1;
			var lineResidueOffset = lineOffset==0 ? startPos.ch : 0;
			var lineResidue = lineResidueOffset + lines[lineOffset].length;
			
			if(objectToUpdate) {
				
				objectToUpdate.line = startPos.line + lineOffset;
				objectToUpdate.ch = lineResidue;
				
			} else {
				
				return {
					line: startPos.line + lineOffset,
					ch: lineResidue
				}
				
			}
		}
        
        // reset state
		currentRule = "";
		currentProperty = "";
		currentPropertyValue = "";
		currentPropertyRange = null;
		currentPropertyValueRange = null;
		
		// check the document mode
		if(currentEditor.getModeForSelection() !== "css") return;
		
		// find the selection
		var doc = currentEditor.document;
		var selection = currentEditor.getSelection();
		var selectionContext = expandSelection(doc,selection.start.line);
		var currentLine = selectionContext.stringValue;
		var selectionStartPos = { line: selectionContext.startLine, ch: 0};

        // find any declaration we could possibly be in
		var infos = []; 
		if(infos=prptyDeclarationFinder.exec(currentLine)) {
			
			do {
				var propertyRange = {
					start: convertToLinePos(selectionStartPos, currentLine.substr(0,infos.index)),
					end: convertToLinePos(selectionStartPos, currentLine.substr(0,prptyDeclarationFinder.lastIndex)),
				};
                
                // check that we actually are in the declaration
				if(Range_isInRange(selection, propertyRange)) {
					
                    // prepare information extraction by resetting the fields
					currentRule = "*";
					currentProperty = infos[1];
					currentPropertyRange = propertyRange;
					
                    // get the property value and fix any known css syntax issue
					currentPropertyValue = infos[2];
					currentPropertyValue = currentPropertyValue.replace(endOfDeclarationFinder,"");
					currentPropertyValue = currentPropertyValue.replace(commentFinder,"");
					
                    // compute the real start and end of the property value
					var currentPropertyValueStart = propertyRange.start.ch+infos[0].indexOf(":")+1;
					var currentPropertyValueStart = { line: propertyRange.start.line, ch: currentPropertyValueStart};
					var currentPropertyValueEnd = convertToLinePos(currentPropertyValueStart, currentPropertyValue);
					currentPropertyValueRange = { 
						start: currentPropertyValueStart,
						end: currentPropertyValueEnd
					};
                    								
					// check that the previous fixes didn't change the matching status
                    propertyRange.end = currentPropertyValueRange.end;
					if(!Range_isInRange(selection, propertyRange)) {
						
                        // re-reset to be sure
						currentRule = "";
						currentProperty = "";
						currentPropertyValue = "";
						currentPropertyRange = null;
						currentPropertyValueRange = null;
						
					} else {
						
                        // now we need to find the rule selector...
                        currentRule = findRule(doc, selection.start);                         
						break;
						
					}
					
				}
				
			} while(infos=prptyDeclarationFinder.exec(currentLine));
			
		}
		
	}
	
	// hook up some events
	$(EditorManager).on("activeEditorChange", onEditorChanged);
	onEditorChanged();
	
    //
	// remote calls
    //
    
    function editor_init() {
		return Inspector.Runtime.evaluate("('_LD_CSS_EDITOR' in window)")
		.then(function(v) {
			if(!v || !v.result || !v.result.value) {
				Inspector.Runtime.evaluate(bwScript).then(ignore).then(resetLivePreview);
			}
		})
    }
    
	function editor_startEditing(selector,property,value) {
        
		//
        // firstly, let's create the auto-update logic
		//
        setupUpdateLoop();
        
		//
        // secondly, let's trigger the panel logic
		//
		return (
            editor_init()
            .then(function() {
                return Inspector.Runtime.evaluate(
        			"_LD_CSS_EDITOR.startEditing("+
        				"unescape('"+escape(property)+"'),"+
        				"unescape('"+escape(selector)+"'),"+
        				"unescape('"+escape(value)+"')"+
        			")"
                )
    		}).then(ignore)
        );
        
        // 
        // format the new value by following the existing formatting
        // 
        function reformatValue(newValue) {
            try {
                            
                // extract data
                var cPR = currentPropertyRange; 
                var currentPropertyText = currentEditor.document.getRange(cPR.start,cPR.end);
                var startspacing = currentPropertyText.match(/\:(\s*)/)[1];
                var interspacing = currentPropertyValue.match(/\((\s*)/)[1];
                var closespacing = currentPropertyValue.match(/(\s*)\)\s*;?\s*}?"?\s*$/)[1];
                var commaspacing = interspacing;
                
                // correct data
                if(!startspacing) startspacing = ' ';
                if(!commaspacing) commaspacing = ' ';
                
                // perform replaces if needed
                newValue = ' ' + newValue;
                if(interspacing.indexOf('\n') >= 0 || startspacing != ' ') {
                    newValue = newValue.replace(/^\s*/,startspacing);
                    newValue = newValue.replace(/^([^(]*)\(\s*/,"$1("+interspacing);
                    newValue = newValue.replace(/\,\s*/g,","+commaspacing);
                    newValue = newValue.replace(/\s*\)\s*$/,closespacing+")");
                }
                
            } catch(ex) {
                
                // log the error
                console.log("new shape value formatting failled:")
                console.dir(ex);
                console.log("using the default formatting insted")
                
                // add some space, just to be sure
                newValue = ' ' + newValue;
                
            }
            
            return newValue;
        }
        
        // 
        // call a function every 100ms to update the current value if needed
        // 
        function setupUpdateLoop() {
        
            var hasSeenEditorOnce = false;
            currentEditorUpdater = setInterval(function() {
                
                // try to contact the preview page, stop polling if it fails
                var promise = Inspector.Runtime.evaluate("_LD_CSS_EDITOR.currentEditor.isOpen() ? _LD_CSS_EDITOR.currentCSSValue : undefined.throw()")
                if(!promise) { clearInterval(currentEditorUpdater); return; }
                
                // handle the response
                promise.then(function(currentCSSValue) {
                    
                    if(!currentCSSValue || currentCSSValue.wasThrown) {
                        
                        // if the shape editor has been closed for some reason, stop this loop
                        if(hasSeenEditorOnce) clearInterval(currentEditorUpdater);
                        
                    } else {
                        
                        hasSeenEditorOnce = true;
                        
                        // refuse to update if the user is typing
                        if(EditorManager.getFocusedEditor()) return;
                        
                        // detect any value change
                        var newValue = currentCSSValue.result.value
                        if(newValue && currentPropertyValueRange) {
                            
                            // do not update if it didn't change
                            if(newValue.replace(/\s+/g,'') == currentPropertyValue.replace(/\s+/g,'')) return;
                            
                            // add a semi-colon if the declaration is otherwise invalid
                            var hasSemicolon = (
                                currentEditor.document.getLine(currentPropertyValueRange.end.line)
                                .substr(currentPropertyValueRange.end.ch,1)
                                == ";"
                            );
                            
                            // format the declaration in multiple lines if needed, using the user formatting as a template
                            newValue = reformatValue(newValue);
                            
                            // try to make sure we stay in the property
                            currentEditor.setSelection(
                                currentPropertyRange.start,
                                currentPropertyRange.start
                            );
                            
                            // update the document for real
                            currentEditor.document.replaceRange(
                                newValue+(hasSemicolon?'':'; '),
                                currentPropertyValueRange.start,
                                currentPropertyValueRange.end,
                                "css-live-update"
                            );
                            
                            // make sure we stay in the property
                            currentEditor.setSelection(
                                currentPropertyValueRange.start,
                                currentPropertyValueRange.start
                            );
                        }
                        
                    }
                    
                })
                
            },97);
            
        }
        
	}
    
    // 
    // update the in-browser editor value to match the one the user just typed
    // 
    function editor_updateValue(newValue) {
        
        if(newValue) {
            
            // injects the new value
            return Inspector.Runtime.evaluate(
    			"_LD_CSS_EDITOR.updateValue("+
    				"unescape('"+escape(newValue)+"'),"+
					"true"+
                ")"
    		).then(ignore);
            
        } else {
            
            // just update the editor
            return Inspector.Runtime.evaluate(
    			"_LD_CSS_EDITOR.updateValue("+
    				"_LD_CSS_EDITOR.currentCSSValue,"+
					"true"+
                ")"
    		).then(ignore);
            
            
        }

    }
	
	function editor_stopEditing() {
        clearInterval(currentEditorUpdater);
		return Inspector.Runtime.evaluate(
			"_LD_CSS_EDITOR.stopEditing(); _LD_CSS_EDITOR.currentCSSValue='';"
		).then(ignore);
	}
	
	function editor_isOpen() {_LD_CSS_EDITOR
		return Inspector.Runtime.evaluate(
			"(!!_LD_CSS_EDITOR.currentEditor) && (!!_LD_CSS_EDITOR.currentEditor.isOpen())"
		);
	}
	
	function editor_getCurrentCSSValue() {
		return Inspector.Runtime.evaluate(
			"_LD_CSS_EDITOR.currentCSSValue"
		)
	}
    
    function resetLivePreview() {

		currentRule = "";
		currentProperty = "";
		currentPropertyValue = "";
		currentPropertyRange = null;
		currentPropertyValueRange = null;

        onSelectionChanged();
        
    }
    
    
    
    //
    // initalization script
    //
    	
	// load some script from the package
	var bwScript = (function(){
		
		var bwScript = "var _LD_CSS_EDITOR={};";
		
		// synchronous xhr, because why not? (hum hum)
		function addScript(url) {
			var xhr = new XMLHttpRequest(); 
			xhr.open('GET', require.toUrl(url), false); 
			xhr.send(null); 
			bwScript += xhr.responseText + ';\n\n';	
		}
		
		// requirements
		addScript('third-party/tatkins/in_browser.css-syntax.js');
		addScript('third-party/rcaliman/raphael/in_browser.raphael.js');
		addScript('third-party/rcaliman/raphael/in_browser.raphael.free_transform.js');
		
		// main code
		addScript('in_browser.main.js');
		
		//// box support
		//addScript('third-party/rcaliman/in_browser.box-overlay.js');
		//addScript('third-party/rcaliman/in_browser.main.box.js');
		
		// shapes support
		addScript('third-party/rcaliman/in_browser.shape-overlay.js');
		addScript('third-party/rcaliman/in_browser.main.shapes.js');
		
		// add error handling
		bwScript = "try { "+bwScript+" } catch(ex) { console.warn(ex+'\\n\\n'+ex.stack); }";
		
		// return the value
		return bwScript;
		
	}());
	
	// load those scripts into the page
	!function() {
		
		function onReady() {
			editor_init();
		}
	
		function onStatusChange(event, status) {
	        if (status >= LiveDevelopment.STATUS_ACTIVE) {
	        	onReady(); //$(LiveDevelopment).off("statusChange", onStatusChange);
	        }
	    }
		
		$(LiveDevelopment).on("statusChange", onStatusChange);
		if(LiveDevelopment.status >= LiveDevelopment.STATUS_ACTIVE) {
			onReady();
		}
		
	}();
	
});
