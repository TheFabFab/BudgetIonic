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
                files: ["test/**/*.ts", "test/tsconfig.json"],
                tasks: ["commands:tsc-tests"],
                options: {
                    spawn: false
                }
            },
            scripts: {
                files: ["scripts/**/*.ts", "scripts/tsconfig.json"],
                tasks: ["commands:tsc-scripts"],
                options: {
                    spawn: false
                }
            },
            ionic: {
                files: ["../../ionic/dist/js/ionic.bundle.js"],
                tasks: ["copy:ionic"],
                options: {
                    spawn: false
                }
            },
            sass: {
                files: ["www/lib/ionic/scss/*.scss", "www/css/*.scss"],
                tasks: ["sass:ionic"]
            },
            www: {
                options: {
                    livereload: 35729
                },
                files: ["www/**/*.js", "www/**/*.html", "www/**/*.css"]
            }
        },
        commands: {
            "tsc-tests": {
                cmd: "tsc -p test",
                force: true
            },
            "tsc-scripts": {
                cmd: "tsc -p scripts",
                force: true
            }
        },
        connect: {
            server: {
                options: {
                    port: 8181,
                    hostname: "0.0.0.0",
                    base: ["www", "./"],
                    livereload: true
                }
            }
        },
        copy: {
            ionic: {
                src: "../../ionic/dist/js/ionic.bundle.js",
                dest: "www/lib/ionic/js/ionic.bundle.js"
            }
        },
        sass: {
            ionic: {
                files: {
                    "www/lib/ionic/css/ionic.css": "www/lib/ionic/scss/ionic.scss",
                    "www/css/style.css": "www/css/style.scss"
                }
            }
        },
        concurrent: {
            watch: {
                tasks: ["watch:sass", "watch:scripts", "watch:tests", "watch:ionic"],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });

    grunt.registerTask("default", ["bower:install"]);
    grunt.registerTask("serve", ["connect:server", "watch:www"]);
    grunt.registerTask("compile", ["concurrent:watch"]);

    grunt.loadNpmTasks("grunt-bower-task");
    grunt.loadNpmTasks("grunt-commands");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-http-server");
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-sass");
    grunt.loadNpmTasks('grunt-concurrent');
};