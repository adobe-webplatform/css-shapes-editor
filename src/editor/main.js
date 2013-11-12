require.config({
    // baseUrl: './', // infered from data-main on <script>
    paths: {
        app: '../app',
        'eve': 'third-party/eve/eve'
    }
    
    // TODO: add Raphael as shim
});

define('main', ['CSSShapesEditor'], function(editor){
    
    return editor
})