/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global module, require */

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
  
    'use strict';
  
    require('load-grunt-tasks')(grunt, {
        pattern: ['grunt-*', '!grunt-template-jasmine-requirejs']
    });
   
    var pkg = grunt.file.readJSON("package.json");

    grunt.initConfig({
        
        // configurable paths
        yeoman: {
            src: 'src',
            dist: 'dist',
            test: 'test'
        },
        
        banner: grunt.file.read('./COPYRIGHT')
                    .replace(/@NAME/, pkg.name)
                    .replace(/@DESCRIPTION/, pkg.description)
                    .replace(/@VERSION/, pkg.version)
                    .replace(/@DATE/, grunt.template.today("yyyy-mm-dd")),
        
        watch: {
            files: ['<%= yeoman.src %>/{,*/}*.js'],
            // tasks: ['jshint']
        },
        
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                '<%= yeoman.src %>/*.js',
                // 'test/spec/{,*/}*.js'
            ]
        },
        
        jasmine: {
            src: '<%= yeoman.src %>/*.js',
            options: {
                specs: '<%= yeoman.test %>/spec/*Spec.js',
                helpers: '<%= yeoman.test %>/*Helper.js',
                template: require('grunt-template-jasmine-requirejs'),
                templateOptions: {
                    requireConfigFile: '<%= yeoman.test %>/main.js',
                    requireConfig: {
                        baseUrl: '<%= yeoman.src %>',
                    }
                }
            }
        },
        
        requirejs: {
          compile: {
            options: {
              baseUrl: '<%= yeoman.src %>',
              mainConfigFile: '<%= yeoman.src %>/main.js',
              out: pkg.main,
              name: 'main',
              include: ['third-party/almond/almond'],
              wrap: {         
                  startFile: '<%= yeoman.src %>/fragments/start.frag',
                  endFile: '<%= yeoman.src %>/fragments/end.frag'
              },
              optimize: 'none'
            }
          }
        },
        
        usebanner: {
            dist: {
              options: {
                position: 'top',
                banner: '<%= banner %>'
              },
              files: {
                src: [ pkg.main ]
              }
            }
        }
    });
    
    grunt.registerTask('build', ['jshint', 'requirejs', 'usebanner'])
    
    grunt.registerTask('test', ['jasmine'])

    grunt.registerTask('default', [
        'jshint',
        // 'test',
        // 'build'
    ]); 
};
