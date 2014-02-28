/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, eve */

define(['eve', 'CSSUtils', 'snap'], function(eve, CSSUtils, Snap){
    "use strict";
    
    function Editor(target, value){
        
        if (!target || !(target instanceof HTMLElement)){
            throw new TypeError('Target expected as HTMLElement object, but was: ' + typeof target);
        }
        
        this.target = target;
        this.value = value;
        this.holder = null; // setup by setupEditorHolder()
        
        // target element offsets with regards to the page
        // setup by setupOffsets()
        this.offsets = {
            left: 0,
            top: 0
        };
    }
    
    Editor.prototype = {
        setup: function(){
            this.setupEditorHolder();
            this.setupDrawingSurface();
            this.setupOffsets();
            
            window.setTimeout(function(){
                this.trigger('ready');
            }.bind(this));
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
            
            // make sure editor is the top-most thing on the page
            // see http://softwareas.com/whats-the-maximum-z-index
            this.holder.style.zIndex = 2147483647; 
            
            // other styling stuff
            this.holder.style.background = "rgba(0, 194, 255, 0.2)";
            this.holder.setAttribute('data-role', 'shape-editor');
            
            // add this layer to the document
            document.body.appendChild(this.holder);
            
            // resize tricks
            this.setupEditorHolder();
        },
        
        setupDrawingSurface: function(){
            this.snap = new Snap('100%','100%');
            this.holder.appendChild(this.snap.node);
            this.paper = this.snap.paper;
        },
        
        setupOffsets: function() {
            var rect = this.target.getBoundingClientRect(),
                box = CSSUtils.getContentBoxOf(this.target);
                
            this.offsets.left = rect.left + window.scrollX + box.left;
            this.offsets.top = rect.top + window.scrollY + box.top;
        },
        
        /*
            Visually decorates this.shape
            
            Uses stacked `<use>` SVG elements based on the shape,
            with different styling to achieve complex decoration, such as the two-color dashed outlines
            
            @param {Array} path An array with objects with decoration attributes.
            
        */
        setupShapeDecoration: function(path) {
            if (!path){
                return;
            }
            
            // enforce an array of path attribute objects
            if (typeof path === 'object' && typeof path.length !== 'number'){
                path = [path];
            }
            
            var shape = this.shape;
            var group = this.paper.group();
            
            path.forEach(function(pathAttr){
                group.add(shape.use().attr(pathAttr));
            });
            
            group.toBack();
        },
        
        remove: function() {
            var holder = this.holder;
            
            if (holder && holder.parentElement){
                holder.parentNode.removeChild(holder);
            }
            
            this.trigger('removed', {});
        },
        
        toggleFreeTransform: function(){
            // to be implemented by specialized editors, higher in the prototype chain
        },
        
        turnOnFreeTransform: function(){
            if (this.transformEditor){
                // aready turned on
                return;
            }

            this.toggleFreeTransform();
        },

        turnOffFreeTransform: function(){
            if (!this.transformEditor){
                // already turned off
                return;
            }

            this.toggleFreeTransform();
        },
        
        on: eve.on,
        off: eve.off,
        trigger: eve
    };   
    
    return Editor;
});
