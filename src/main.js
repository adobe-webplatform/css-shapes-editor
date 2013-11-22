require.config({
    // baseUrl: './', // infered from data-main on <script>
    paths: {
        'eve': 'third-party/eve/eve',
        'snap': 'third-party/snap/snap.svg-min',
        'snap.plugins': 'third-party/snap.plugins/snap.plugins',
        'snap.freeTransform': 'third-party/snap.freetransform/snap.freetransform'
    }
});

define('main', ['CSSShapesEditor'], function(editor){
    return editor
})