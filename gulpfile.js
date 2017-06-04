var gulp = require('gulp'),
    sass = require('gulp-sass'),
    webpack = require('webpack-stream'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    cache = require('gulp-cache'),
    htmlValidator = require('gulp-html'),
    runSequence = require('run-sequence'),
    del = require('del'),
    size = require('gulp-size');

gulp.task('sass', function() {
  return gulp.src('app/scss/**/*.scss')
    .pipe(size())
    .pipe(sass())
    .pipe(size())
    .pipe(gulp.dest('dist/'))
});

gulp.task('images', function() {
  return gulp.src('app/imgs/**/*.+(png|jpg|gif|svg)')
    .pipe(size())
    .pipe(cache(imagemin()))
    .pipe(size())
    .pipe(gulp.dest('dist/imgs'));
});

gulp.task('html', function() {
  return gulp.src('app/**/*.html')
  .pipe(cache(htmlValidator({
    verbose: true
  })))
  .pipe(gulp.dest('dist/'));
});

gulp.task('clean:dist', function() {
  return del.sync('dist');
})

gulp.task('webpack', function() {
  return gulp.src('app/js/player.js')
    .pipe(size())
    .pipe(webpack(require('./webpack.config.js')))
    .pipe(uglify())
    .pipe(size())
    .pipe(gulp.dest('dist/js'))
});


gulp.task('default', function(callback) {
  runSequence(['sass', 'webpack', 'browserSync', 'watch']);
});

gulp.task('build',  function() {
  runSequence('clean:dist', 'sass', ['webpack', 'html', 'images']);
});
