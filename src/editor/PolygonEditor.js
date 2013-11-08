(function(scope){
    if (!scope.Editor){
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
    
    scope.PolygonEditor = PolygonEditor
})(this)