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
  # https://github.com/mathiasbynens/grunt-yui-compressor
  # May end up porting to https://github.com/gruntjs/grunt-contrib-uglify
  grunt.loadNpmTasks('grunt-yui-compressor')
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    shell:
      options:
        stderr: false
      bower:
        command: ["bower update"].join("&&")
    min:
      combine:
        src:["js/c.js","bower_components/purl/purl.js","bower_components/xmlToJSON/lib/xmlToJSON.js"]
        dest:"js/combined.min.js"
      dist:
        src:["js/c.js"]
        dest:"js/c.min.js"
      minpurl:
        src: ["bower_components/purl/purl.js"]
        dest: "js/purl.min.js"
      minxmljson:
        src: ["bower_components/xmlToJSON/lib/xmlToJSON.js"]
        dest: "js/xmlToJSON.min.js"
    cssmin:
      dist:
        src:["css/main.css"]
        dest:"css/main.min.css"
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
        tasks: ["coffee:compile","min:dist"]
      styles:
        files: ["css/main.css"]
        tasks: ["cssmin"]
  ## Now the tasks
  grunt.registerTask("default",["watch"])
  grunt.registerTask("compile","Compile coffeescript",["coffee:compile","min:dist"])
  ## The minification tasks
  # Part 1
  grunt.registerTask("minifyIndependent","Minify Bower components that aren't distributed min'd",["min:minpurl","min:minxmljson"])
  # Part 2
  grunt.registerTask("minifyBulk","Minify all the things",["min:combine","min:dist","cssmin:dist"])
  # Main call
  grunt.registerTask "minify","Minify all the things",->
    grunt.task.run("minifyIndependent","minifyBulk")
  ## Global update
  # Bower
  grunt.registerTask("updateBower","Update bower dependencies",["shell:bower"])
  # Minify the bower stuff in case it changed
  grunt.registerTask "update","Update dependencies", ->
    grunt.task.run("updateBower","minify")
  ## Deploy
  grunt.registerTask "build","Compile and update, then watch", ->
    grunt.task.run("update","compile","default")
