/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(['Editor'], function(Editor){
    "use strict";
    
    if (!Editor){
        throw "Missing editor"
    }
    
    function PolygonEditor(target, property, value){
        Editor.apply(this, arguments)
    }
    
    PolygonEditor.prototype = Object.create(Editor.prototype);
    PolygonEditor.prototype.getCSSValue = function(){
        
    }
    PolygonEditor.prototype.constructor = PolygonEditor
    
    return PolygonEditor
})