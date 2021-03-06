var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var babelify = require('babelify');
var fs = require('fs');
var duration = require('gulp-duration');
var eslint = require('gulp-eslint');

var createBundler = function(folder) {
  return browserify({
    entries: [
      './patterns/' + folder + '/src/app.jsx'
    ],
    debug: true,
    transform: [ babelify ]
  });
}

var build = function (folder, callback) {
  folder.bundler.bundle()
    .on('error', gutil.log)
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true })).on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(duration(folder.path + ' changed'))
    .pipe(gulp.dest('./patterns/' + folder.path + '/public'))
    .on('end', callback ? callback : function() {});
};
var folders = fs.readdirSync('./patterns')
  .filter(function (folder) {
    try { fs.statSync('./patterns/' + folder + '/src/app.jsx') } catch(err) {
      gutil.log(gutil.colors.yellow('Note: Path ./patterns/' + folder + '/src/app.jsx does not exist ' +
        'which is fine. It simply means that the ./patterns/' + folder + ' does not require an example or it is placed in another repo.'));
      return false;
    }
    return true;
  })
  .map(function (folder) {
    return { path: folder, bundler: createBundler(folder) }
  });

gulp.task('build', function () {
  return Promise.all(folders.map(function (folder) {
    return new Promise(function (resolve, reject) {
      build(folder, resolve);
    });
  }));
});

gulp.task('build-watch', ['build'], function () {
  folders.forEach(function (folder) {
    gulp.watch('./patterns/' + folder.path + '/src/**/*.*').on('change', function () {
      build(folder);
    });
  });
});

gulp.task('lint', function () {
  return gulp.src(['**/*.js','!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('default', ['build']);
gulp.task('watch', ['build-watch']);
