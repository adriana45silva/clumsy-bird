/*global module:false*/
module.exports = function(grunt) {
    var sourceFiles = [
        'js/game.js',
        'js/resources.js',
        'js/entities/entities.js',
        'js/entities/HUD.js',
        'js/screens/title.js',
        'js/screens/play.js',
        'js/screens/gameover.js',
    ];

    // Project configuration.
    grunt.initConfig({
        watch: {
            files: 'js/**/*.js',
            tasks: ['concat']
        },

        concat: {
            dist: {
                src: sourceFiles,
                dest: 'build/clumsy.js'
            }
        },

        uglify: {
            options: {
                report: 'min',
                preserveComments: 'some'
            },
            dist: {
                files: {
                    'build/clumsy-min.js': [
                        sourceFiles
                    ]
                }
            }
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },

            beforeConcat: {
                files: {
                    src: sourceFiles
                }
            },

            afterConcat: {
                files: {
                    src: [ sourceFiles ]
                }
            }
        },

        connect : {
            root : {
                options : {
                    port : 8001,
                    keepalive : true,
                    host: '*'
                }
            }
        },

        clean: {
            dist: [
                'build/clumsy.js',
                'build/clumsy-min.js'
            ],
        },

        browserSync: {
            dev: {
                bsFiles: {
                    src : 'js/**/*.js'
                },
                options: {
                    watchTask: true
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-browser-sync');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-connect');

    // Default task.
    grunt.registerTask('default', ['browserSync', 'watch']);
    grunt.registerTask('build', ['concat', 'uglify']);
    grunt.registerTask('lint', ['jshint:beforeConcat', 'concat', 'jshint:afterConcat']);
};