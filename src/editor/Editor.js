/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, window, eve */

(function(glob){
    "use strict";
    
    function Editor(target, property, value){
        this.target = target;
        this.property = property;
        this.value = value || null;
    }
    
    Editor.prototype = {
        value: function(value){
            if (typeof value === 'string') {
                this.value = value
                this.trigger('valuechange', this)
            }
            
            return this.value;
        },
        
        on: eve.on,
        off: eve.off,
        trigger: eve
    };   
    
    glob.Editor = Editor;
    
})(this);
