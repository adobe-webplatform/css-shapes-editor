require.config({
    // set baseUrl to src/editor/
    baseUrl: '../',
    paths: {
        'jquery': 'third-party/jquery/jquery.min',
        'text': 'third-party/requirejs/text',
        'eve': 'third-party/eve/eve',
        'Raphael': 'third-party/raphael/raphael-min',
        'spec': 'test/spec'
    }
});
require([
    'text',
    'spec/CSSShapesEditorSpec',
    'spec/PolygonEditorSpec'
    ], function(){
    var env = jasmine.getEnv();
    env.addReporter(new jasmine.HtmlReporter);
    env.execute();
});