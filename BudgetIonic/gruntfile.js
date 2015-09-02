/// <binding BeforeBuild='commands:tsc-tests, commands:tsc-scripts' />
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
            www: {
                options: {
                    livereload: 35729,
                },
                files: ['www/**/*.*'],
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
        connect: {
            server: {
                options: {
                    port: 8181,
                    hostname: '0.0.0.0',
                    base: ['www', './'],
                    livereload: true,
                }
            }
        }
    });

    grunt.registerTask("default", ["bower:install"]);
    grunt.registerTask("serve", ["connect:server", "watch:www"]);
    grunt.registerTask("compile", ["watch:scripts", "watch:tests"]);

    grunt.loadNpmTasks("grunt-bower-task");
    grunt.loadNpmTasks("grunt-commands");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-http-server');
    grunt.loadNpmTasks('grunt-contrib-connect');
};