/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, eve */

define(['eve', 'CSSUtils'], function(eve, CSSUtils){
    "use strict";
    
    function Editor(target, value){
        
        if (!target || !target.parentNode){
            throw TypeError('Target expected as DOM object, but was: ' + typeof target)
        }
        
        this.target = target;
        this.value = value;
        this.holder = null; // setup by setupEditorHolder()
        
        // target element offsets with regards to the page
        // setup by setupOffsets()
        this.offsets = {
            left: 0,
            top: 0
        }
        
        // this.init()
    }
    
    Editor.prototype = {
        setup: function(){
            this.setupEditorHolder();
            this.setupDrawingSurface();
            this.setupOffsets();
            
            window.setTimeout(function(){
                this.trigger('ready')
            }.bind(this)) 
        },
        
        setupEditorHolder: function() {
            
            // abort if editor holder already exists
            if (this.holder) {
                var root = document.documentElement;
                this.holder.style.display = 'none';
                this.holder.style.minHeight = root.scrollHeight + 'px';
                this.holder.style.minWidth = root.scrollWidth + 'px';
                this.holder.style.display = 'block';
                return;
            }
            
            // create an element for the holder
            this.holder = document.createElement('div');
            
            // position this element so that it fills the viewport
            this.holder.style.position = "absolute";
            this.holder.style.top = 0;
            this.holder.style.left = 0;
            this.holder.style.right = 0;
            this.holder.style.bottom = 0;
            
            // see http://softwareas.com/whats-the-maximum-z-index
            this.holder.style.zIndex = 2147483647; 
            
            // other styling stuff
            this.holder.style.background = "rgba(0, 194, 255, 0.2)";
            this.holder.setAttribute('data-role', 'shape-editor')
            
            // add this layer to the document
            document.body.appendChild(this.holder)
            
            // resize tricks
            this.setupEditorHolder();
        },
        
        setupDrawingSurface: function(){
            this.snap = Snap('100%','100%');
            this.holder.appendChild(this.snap.node)
            this.paper = this.snap.paper
        },
        
        setupOffsets: function() {
            var rect = this.target.getBoundingClientRect(),
                box = CSSUtils.getContentBoxOf(this.target);
                
            this.offsets.left = rect.left + window.scrollX + box.left;
            this.offsets.top = rect.top + window.scrollY + box.top;
        },
        
        remove: function() {
            var holder = this.holder;
            
            if (holder && holder.parentElement){
                holder.parentNode.removeChild(holder)
            }
            
            this.trigger('removed', {})
        },
        
        on: eve.on,
        off: eve.off,
        trigger: eve
    };   
    
    return Editor;
})
