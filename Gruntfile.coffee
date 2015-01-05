#spawn = require('child_process').spawn
#require("load-grunt-tasks")(grunt)

module.exports = (grunt) ->
  # Gruntfile
  # https://github.com/sindresorhus/grunt-shell
  grunt.loadNpmTasks("grunt-shell")
  # https://www.npmjs.com/package/grunt-contrib-coffee
  grunt.loadNpmTasks("grunt-contrib-coffee")
  # https://github.com/gruntjs/grunt-contrib-watch
  grunt.loadNpmTasks("grunt-contrib-watch")
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    shell:
      options:
        stderr: false
      bam:
        command: "cake bam"
      min:
        command: "cake min"
      bower:
        command: ["bower update"].join("&&")
      minify:
        command: ["java -jar yuicompressor.jar bower_components/purl/purl.js -o js/purl.min.js","java -jar yuicompressor.jar bower_components/xmlToJSON/lib/xmlToJSON.js -o js/xmlToJSON.min.js","java -jar yuicompressor.jar js/loadJQuery.js -o js/loadJQuery.min.js"].join("&&")
    coffee:
      compile:
        options:
          bare: true
          join: true
          sourceMapDir: "coffee/maps"
          sourceMap: true
        files:
          "js/c.js":"coffee/*.coffee"
    watch:
      scripts:
        files: ["coffee/*.coffee"]
        tasks: ["coffee:compile","shell:min"]
  # Now the tasks
  grunt.registerTask("default",["watch"])
  grunt.registerTask("compile","Compile coffeescript",["coffee:compile","shell:min"])
  grunt.registerTask("update","Update bower dependencies",["shell:bower","shell:minify"])
  grunt.registerTask "build","Compile and update, then watch", ->
    grunt.task.run("update","compile","default")
