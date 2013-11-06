module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        open: {
          reloadExtensions: {
            // requires Extension Reloader (https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid)
            path: 'http://reload.extensions'
          },
          google: {
            path: 'http://google.com/'
          }
        },
        
        watch: {
          files: ['*.js','*.html'],
          tasks: ['open:reloadExtensions']
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-open');
    grunt.registerTask('default', 'open:reloadExtensions');
}