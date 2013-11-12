/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, eve */

define(['eve'], function(eve){
    "use strict";
    
    function Holder(){
        var body = document.body
        return
    }
    
    function Editor(target, property, value){
        
        if (!target || !target.parentNode){
            throw TypeError('Target expected as DOM object, but was: ' + typeof target)
        }
        
        this.target = target;
        this.property = property;
        this.value = value;
        this.holder = null; // setup by setupEditorHolder()
        
        this.init()
    }
    
    Editor.prototype = {
        getCSSValue: function() {
            return this.value
        },
        
        getCSSProperty: function() {
            return this.property
        },
        
        parseShape: function(shape){
            
        },
        
        init: function(){
            this.setupEditorHolder()
            
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
            document.documentElement.appendChild(this.holder)
            
            // resize tricks
            this.setupEditorHolder();
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
