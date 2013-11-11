/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(['Editor'], function(Editor){
    "use strict";
    
    if (!Editor){
        throw "Missing editor"
    }
    
    function CircleEditor(){
    }
    
    CircleEditor.prototype = Object.create(Editor.prototype);
    CircleEditor.prototype.constructor = CircleEditor
    
    return CircleEditor
})