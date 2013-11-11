require.config({
    // set baseUrl to src/editor/
    baseUrl: '../',
    paths: {
        'jquery': 'third-party/jquery/jquery.min',
        'eve': 'third-party/eve/eve',
        'spec': 'test/spec'
    }
});
require(['spec/CSSShapesEditorSpec'], function(){
    var env = jasmine.getEnv();
    env.addReporter(new jasmine.HtmlReporter);
    env.execute();
});