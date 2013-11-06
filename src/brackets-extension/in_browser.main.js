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

!function() {
	
	//
	// consts
	//
	var prefix = "-webkit-";
	
	//
	// basic behavior, and stuff
	//
	var cssLiveDev = window._LD_CSS_EDITOR = {
	
		version: 2.0,
		
		currentElement    : null,
	    currentSelector   : "*",
		
		supportedProperties        : {},
		currentCSSProperty         : '',
		currentCSSPrefixedProperty : '',
		
		futureCSSValue    : '',
		currentCSSValue   : '',
			
		whiteOverlay: document.createElement('div'),
		selectionOverlay: document.createElement('div'),
	
		// 
		// white overlay
		//
		showWhiteOverlay: function() {
			if(!this.whiteOverlay.parentNode) {
				this.whiteOverlay.style.cssText = (
					"position:fixed;"
					+ "top:0; bottom:0; left:0; right:0;"
					+ "z-index: 1000000; pointer-events: none;"
					+ "background:white; opacity:0.5;"
				);
				document.body.appendChild(this.whiteOverlay);
			} else {
				this.whiteOverlay.style.display='block';
			}
		},
	
		hideWhiteOverlay: function() {
			this.whiteOverlay.style.display='none';
		},
	
		//
		// selection overlay
		//
		showSelectionOverlay: function(rect) {
		
	        var This=this;
        
			//
			// compute the overlay section
			// 
			if(!rect) {
			
				// if we have no info at all, display nothing
				this.currentElement = document.documentElement;
				rect = { top:0, left:0, width:0, height:0 }
			
			} else if(rect.clientX) {
			
				// avoid updating in the background, as that fails on Chrome+Mac
				if(!document.hasFocus()) {
					this.currentElement = document.documentElement;
					rect = { top:0, left:0, width:0, height:0 }
				} else {
					// get the overlay rectangle from the cursor location
					this.currentElement = snapToAncestor(elementsFromPoint(rect.clientX, rect.clientY));
					rect = this.currentElement.getBoundingClientRect();
					rect = { top:parseInt(rect.top), left:parseInt(rect.left), width:parseInt(rect.width), height:parseInt(rect.height) }
				}
				
			}
		
			//
			// updates the style of the overlay layer
			// 
			this.selectionOverlay.style.cssText = (
				"position:fixed;"
				+ "top:"+rect.top+"px; height:"+rect.height+"px; left:"+rect.left+"px; width:"+rect.width+"px;"
				+ "z-index: 1000001; pointer-events: none;"
				+ "background:black; opacity:0.3;"
			);
			
			//
			// add the overlay layer to the document if not already done
			//
			if(!this.selectionOverlay.parentNode) {
				document.body.appendChild(this.selectionOverlay);
			}
			
			// exits the function now
			return true;
			
			
			//
			// try to find an element that matches the current selector from a list of elements
			//
	        function snapToAncestor(elements) {
	            var firstElement = elements[0]; 
	            var matchesSelector = firstElement.matchesSelector || firstElement.matches || firstElement.webkitMatchesSelector || firstElement.mozMatchesSelector || firstElement.msMatchesSelector || function(){return true}; 
            
	            // for each element, in order
	            for(var i=0, element; element=elements[i]; i++) {
            
	                // look for the ancestors of the current element...
	                do {

	                    // test them against the selector
	                    var snapToElement = matchesSelector.call(element, This.currentSelector);

	                    // and return any of it matching the selector
	                    if(snapToElement) return element;
                
	                } while(element=element.parentElement);
            
	            }
			
				// try to accomodate any 404 error by removing pseudo-classes from the mix
				var tempSelector = This.currentSelector.replace(/(\:+)([-a-z0-9]+)(\([^()]*\))?/gi,"")
				if(tempSelector === This.currentSelector) return firstElement;
			
	            // for each element, in order
	            for(var i=0, element; element=elements[i]; i++) {
            
	                // look for the ancestors of the current element...
		            do {

		                // test them against the selector
		                var snapToElement = matchesSelector.call(element, tempSelector);

		                // and return any of it matching the selector
		                if(snapToElement) return element;
            
		            } while(element=element.parentElement);
			
				}
            
	            // if we found nothing...
	            return firstElement;
	        }
        	
			//
			// returns a list of all elements under the cursor
			//
	        function elementsFromPoint(x,y) {
				var elements = [], previousPointerEvents = [], current, i, d;

	            // get all elements via elementFromPoint, and remove them from hit-testing in order
				while ((current = document.elementFromPoint(x,y)) && elements.indexOf(current)===-1 && current != null) {
                
	                // push the element and its current style
					elements.push(current);
					previousPointerEvents.push({
	                    value: current.style.getPropertyValue('pointer-events'),
	                    priority: current.style.getPropertyPriority('pointer-events')
	                });
                
	                // add "pointer-events: none", to get to the underlying element
					current.style.setProperty('pointer-events', 'none', 'important'); 
				}

	            // restore the previous pointer-events values
				for(i = previousPointerEvents.length; d=previousPointerEvents[--i]; ) {
					elements[i].style.setProperty('pointer-events', d.value?d.value:'', d.priority); 
				}
            
	            // return our results
				return elements;
			}
		
		},
	
		hideSelectionOverlay: function() {
			this.selectionOverlay.style.display='none';
		},
	
		//
		// element selection
		//
		startElementSelection: function() {
		
			// stop any editing experience currently open
			this.stopEditing();
			
			// start a new element selection
			this.showWhiteOverlay();
			this.showSelectionOverlay();
			
			// listen to mouse events to relocate this overlay
			window.addEventListener('mousemove', this.showSelectionOverlay);
			window.addEventListener('click', this.onSelectionLayerClicked, true);
			
		},
		
		stopElementSelection: function() {
			
			// stop any currently-open selection 
			this.hideWhiteOverlay();
			this.hideSelectionOverlay();
			
			// stop to listen to mouse events
			window.removeEventListener('mousemove', this.showSelectionOverlay);
			window.removeEventListener('click', this.onSelectionLayerClicked, true);
			
		},
		
		// what happens when the user clicks during the selection
		onSelectionLayerClicked: function(e) {
			this.stopElementSelection();
			this.onElementSelected();
			e.preventDefault(); e.stopImmediatePropagation();
		},
	
		// what happens when an element is selected
		onElementSelected: function() {
			
			var element  = this.currentElement;
			var property = this.currentCSSPrefixedProperty;
			var value    = this.currentCSSValue;
			
			this.currentEditor.startEditing(element,property,value);
			
		},
		
		//
		// hooks for brackets
		//
		
		// start editing experience
		startEditing: function(cssProperty, cssSelector, cssValue, useSelectionAnyway) {
			
	        try {
            	
				// starts by closing any open editor
				this.stopEditing();
				
				
				//
				// WORK ON THE CSS PROPERTY BEING EDITED
				//
				
				// remove all prefixes from the property
				cssProperty = cssProperty.replace(/^-([a-z]+)-/i,'');
			
	            // exctract potential style value
        		this.currentSelector = cssSelector || '*';
	            this.currentCSSProperty = cssProperty; 
				this.currentCSSValue = cssValue;
				
				// put the current browser prefix, if necessary
				if (cssProperty in getComputedStyle(document.documentElement)) {
					this.currentCSSPrefixedProperty = cssProperty;
				} else {
					this.currentCSSPrefixedProperty = prefix + cssProperty;
				}
            
	            // make sure we have an editor for the property
				if(!(this.currentEditor=this.supportedProperties[this.currentCSSProperty])) {
					return;
				}
				
				
				// 
				// WORK ON THE CSS SELECTOR BEING EDITED 
				//
			
	            // try to find some valid element
	            try { this.potentialMatches = visibleElementsIn(document.querySelectorAll(this.currentSelector)) }
	            catch(InvalidSelector) { this.potentialMatches = []; this.currentSelector = '*'; }
				
				// try to accomodate any 404 error by removing pseudo-classes from the mix
				if(this.potentialMatches.length === 0) {
					var tempSelector = this.currentSelector.replace(/(\:+)([-a-z0-9]+)(\([^()]*\))?/gi,"")
					if(tempSelector !== this.currentSelector) {
						try { this.potentialMatches = visibleElementsIn(document.querySelectorAll(tempSelector)) } catch(ex) {}
					}
				}
				
				
				//
				// START THE EDITING EXPERIENCE
				// 
            
	            // show selection or start editing straightaway depending on results
	            if(useSelectionAnyway || this.potentialMatches.length === 0) {
	                
					this.startElementSelection();
					
	            } else {
					
					// select the right element
	                this.currentElement = findBestMatch(this.potentialMatches, this.currentCSSPrefixedProperty, this.currentCSSValue);
	                
					// scroll to the element, minus a few pixels
					var previousScroll = window.scrollY; 
					this.currentElement.scrollIntoView();
					if(window.scrollY != previousScroll) {
						window.scrollY -= 10;
					}

					// trigger the real editor actions
	                this.onElementSelected();
	            }
        
	            return true;
            
	        } catch(ex) {
            
	            console.log(ex); alert(ex + "\n\n" + ex.stack);
	            return false;
            
	        }
			
			
			// remove hidden elements for a list
			function visibleElementsIn(els) {
				var arr = Array.prototype.slice.call(els,0);
				return arr.filter(function(e) { return(e.clientWidth!==0) })
			}
			
			// try to find an element whose property value is the value to edit
			function findBestMatch(elements, property, valueToEdit) {
					
				// try to find an element that uses the shape
				for(var i=0,l=elements.length; i<l; i++) {
			
					// backup current style
					var propertyValue = elements[i].style.getPropertyValue(property);
					var propertyPriority = elements[i].style.getPropertyPriority(property);
			
					var computedStyle = getComputedStyle(elements[i]);
					var initialComputedValue = computedStyle.getPropertyValue(property);
			
					// switch to the new style
					elements[i].style.setProperty(property, valueToEdit, 'important');
			
					// backup the new style
					var newComputedValue = computedStyle.getPropertyValue(property);
			
					// restore the old style
					elements[i].style.setProperty(property, propertyValue, propertyPriority?propertyPriority:'');
			
					// if we have a match, return the element
					if(newComputedValue == initialComputedValue) { return elements[i] }
			
			
				}
		
				// in all other cases, return the first element
				return elements[0];
			}
			
		},
		
		// stop the editing experience
		stopEditing: function() {
			
			// if an element selection was going on:
			this.stopElementSelection();
			
			// if an editor is currently in use:
			this.currentEditor && this.currentEditor.stopEditing();
		},
		
		// report the new value back to brackets, if no conflict is detected
		updateValue: function() {
			
			// perform the real update
			function updateNow(forced) {
				
				// cancel any planned update
				clearTimeout(updateWhenReady.timeout); updateWhenReady.timeout = 0;
	
				// change the actual value
				cssLiveDev.currentCSSValue = cssLiveDev.futureCSSValue;
				
				// propagate the change to the editor
				if(forced) { cssLiveDev.currentEditor && cssLiveDev.currentEditor.updateValue(cssLiveDev.currentCSSValue); }
				
			}
			
			// update now if ready, or plan a future update
			function updateWhenReady() {
				
				var isReadyForUpdate = true;
				var isReadyForUpdate = isReadyForUpdate && (!!cssLiveDev);
				var isReadyForUpdate = isReadyForUpdate && (!!cssLiveDev.currentEditor);
				var isReadyForUpdate = isReadyForUpdate && (!!cssLiveDev.currentEditor.isReadyForBatchUpdate() || document.querySelectorAll(cssLiveDev.currentSelector).length <= 1);
				
				if (isReadyForUpdate) { updateNow(); } 
				else                  { planFutureUpdate() }
				
			};
			
			// generate the actual timer for the update
			function planFutureUpdate() {
				
				// abort if a future update is already planned
				if(updateWhenReady.timeout) return;
				
				// plan a new future update, if it's not the case
				updateWhenReady.timeout = setTimeout(function() {
					updateWhenReady.timeout = 0;
					updateWhenReady();
				}, 64);
				
			}

			// define what actually happens when _LD_CSS_EDITOR.updateValue is called
			function updateValue(newValue, forceUpdate) {
				
				// check that the new value is really different
				if(newValue.replace(/\s+/g,' ').trim() == cssLiveDev.currentCSSValue.replace(/\s+/g,' ').trim()) { return; }
				
				// update the style
				this.currentElement.style.setProperty(cssLiveDev.currentCSSPrefixedProperty, cssLiveDev.futureCSSValue=newValue, "important");
				
				// update the value
				if(forceUpdate) { updateNow(true) } 
				else            { updateWhenReady() }
				
			}
			
			// return the function
			return updateValue;
			
		}()
	
	};

	// bind all functions to the instance, to allow direct use as callbacks
	Object.keys(cssLiveDev).forEach(function(k) {
		if(typeof(cssLiveDev[k]) == "function") {
			cssLiveDev[k] = cssLiveDev[k].bind(cssLiveDev);
		}
	})
	
}()