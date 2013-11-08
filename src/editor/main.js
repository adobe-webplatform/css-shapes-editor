require.config({
    //By default load any module IDs from js/lib
    baseUrl: './',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        app: '../app',
        'eve': 'third-party/eve/eve'
    }
});

define('main', ['xam'], function(xam){
    
    var superx = new xam()
    
    superx.on('ready', function(){
        console.log('xam is ready')
    })
    
    console.warn('main runs')
    
    return superx
})