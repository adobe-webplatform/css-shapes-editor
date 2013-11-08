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
  
    grunt.initConfig({
        // configurable paths
        yeoman: {
            src: 'src',
            dist: 'dist'
        },
        watch: {
            files: ['<%= yeoman.src %>/editor/{,*/}*.js'],
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
              baseUrl: '<%= yeoman.src %>/editor',
              mainConfigFile: "<%= yeoman.src %>/editor/main.js",
              out: '<%= yeoman.dist %>/optimized.js',
              name: 'main',
              optimize: 'none'
            }
          }
        }
    });

    grunt.registerTask('default', [
        'jshint'
        // 'test',
        // 'build'
    ]); 
};
