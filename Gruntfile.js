module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        compass: {
          dist: {
            options: {
              fontsDir: './static/fonts',
              sassDir: './static/sass',
              cssDir: './static/static',
              relativeAssets: true,
              require: ['bootstrap-sass', 'compass/import-once/activate']
            }
          }
        }
    });
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.registerTask('default', ['browserify', 'compass']);
};
