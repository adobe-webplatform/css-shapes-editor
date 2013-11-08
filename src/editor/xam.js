define(['eve'], function(eve){
    function xam(){
        var self = this;
        
        setTimeout(function(){
            self.fire('ready', {'oprea': true})
        }, 500)
    }
    
    xam.prototype = {
        oprea: 'este',
        on: eve.on,
        fire: eve
    }

    // module.exports = xam
    return xam
})
