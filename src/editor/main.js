require.config({
    // baseUrl: './', // infered from data-main on <script>
    paths: {
        app: '../app',
        'eve': 'third-party/eve/eve',
        'raphael': 'third-party/raphael/raphael-min',
        'freeTransform': 'third-party/raphael.free_transform/raphael.free_transform'
    }
});

define('main', ['CSSShapesEditor'], function(editor){
    
    return editor
})