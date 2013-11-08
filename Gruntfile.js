/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global module, require */

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
  
    'use strict';
  
    require('load-grunt-tasks')(grunt);
    
    var pkg = grunt.file.readJSON("package.json");
  
    grunt.initConfig({
        // configurable paths
        yeoman: {
            src: 'src',
            editor: 'src/editor',
            dist: 'dist'
        },
        
        banner: grunt.file.read('./COPYRIGHT')
                    .replace(/@NAME/, pkg.name)
                    .replace(/@VERSION/, pkg.version)
                    .replace(/@DATE/, grunt.template.today("yyyy-mm-dd")) + "\n",
        
        watch: {
            files: ['<%= yeoman.editor %>/{,*/}*.js'],
            // tasks: ['jshint']
        },
        
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                // 'Gruntfile.js',
                '<%= yeoman.src %>/editor/Editor.js',
                // 'test/spec/{,*/}*.js'
            ]
        },
        
        requirejs: {
          compile: {
            options: {
              baseUrl: '<%= yeoman.editor %>',
              mainConfigFile: '<%= yeoman.editor %>/main.js',
              out: '<%= yeoman.dist %>/optimized.js',
              name: 'main',
              include: ['third-party/almond/almond'],
              wrap: {         
                  // TODO: figure out why banner crashes build
                  // startFile: ['<%= banner %>','<%= yeoman.editor %>/fragments/start.frag'],
                  startFile: '<%= yeoman.editor %>/fragments/start.frag',
                  endFile: '<%= yeoman.editor %>/fragments/end.frag'
              },
              optimize: 'none'
            }
          }
        }
    });
    
    grunt.registerTask('build', ['requirejs'])

    grunt.registerTask('default', [
        'jshint',
        // 'test',
        // 'build'
    ]); 
};
