(function(scope){
    if (!scope.Editor){
        throw "Missing editor"
    }
    
    function CircleEditor(){
    }
    
    
    CircleEditor.prototype = Object.create(Editor.prototype);
    CircleEditor.prototype.constructor = CircleEditor
    
    scope.CircleEditor = CircleEditor
})(this)