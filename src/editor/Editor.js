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
        this.value = value || null;
        
        // this.holder = new Holder()
    }
    
    Editor.prototype = {
        getCSSValue: function(){
            return this.value
        },
        
        getCSSProperty: function(){
            return this.property
        },
        
        on: eve.on,
        off: eve.off,
        trigger: eve
    };   
    
    return Editor;
})
