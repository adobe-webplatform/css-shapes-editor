require.config({
    // baseUrl: './', // infered from data-main on <script>
    paths: {
        app: '../app',
        'eve': 'third-party/eve/eve'
    }
});

define('main', ['CSSShapesEditor'], function(editor){
    
    return editor
})