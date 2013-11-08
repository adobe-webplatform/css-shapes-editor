/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(['Editor'], function(Editor){
    "use strict";
    
    if (!Editor){
        throw "Missing editor"
    }
    
    function PolygonEditor(){
        console.log(this)
    }
    
    var abs = {
        target: function(){
            return this.target
        }
    }
    
    PolygonEditor.prototype = Object.create(Editor.prototype);
    PolygonEditor.prototype.constructor = PolygonEditor
    
    return PolygonEditor
})