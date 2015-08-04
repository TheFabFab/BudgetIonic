/// <binding BeforeBuild='commands:tsc-tests, commands:tsc-scripts' ProjectOpened='watch' />
/*
This file in the main entry point for defining grunt tasks and using grunt plugins.
Click here to learn more. http://go.microsoft.com/fwlink/?LinkID=513275&clcid=0x409
*/
module.exports = function (grunt) {
    grunt.initConfig({
        bower: {
            install: {
                options: {
                    targetDir: "www/lib",
                    layout: "byComponent",
                    cleanTargetDir: false
                }
            }
        },
        watch: {
            tests: {
                files: ['test/**/*.ts', 'test/tsconfig.json'],
                tasks: ['commands:tsc-tests'],
                options: {
                    spawn: false,
                },
            },
            scripts: {
                files: ['scripts/**/*.ts', 'scripts/tsconfig.json'],
                tasks: ['commands:tsc-scripts'],
                options: {
                    spawn: false,
                },
            },
        },
        commands: {
            "tsc-tests": {
                cmd: 'tsc -p test',
                force: true
            },
            "tsc-scripts": {
                cmd: 'tsc -p scripts',
                force: true
            }
        },
        'http-server': {
            'dev': {
                root: ['www', 'scripts'],
                port: 8282,
                host: "0.0.0.0",
                showDir: false,
                autoIndex: true,
                cache: 1,
                ext: "html",
                runInBackground: false,
            }
        },
        connect: {
            server: {
                options: {
                    port: 8181,
                    hostname: '0.0.0.0',
                    base: ['www', './'],
                    keepalive: true,
                    livereload: true,
                }
            }
        }
    });

    grunt.registerTask("default", ["bower:install"]);

    grunt.loadNpmTasks("grunt-bower-task");
    grunt.loadNpmTasks("grunt-commands");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-http-server');
    grunt.loadNpmTasks('grunt-contrib-connect');
};