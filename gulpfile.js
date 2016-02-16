var gulp = require('gulp');
// Include Our Plugins
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var mocha = require('gulp-mocha');
var appSrc = 'argumints.js';

//var cssSrc = 'scss/*.scss';

//Lint Task
gulp.task('lint', function() {
    return gulp.src(appSrc).pipe(jshint()).pipe(jshint.reporter('default'));
});
//
////Compile Our Sass
//gulp.task('sass', function() {
// return gulp.src('scss/*.scss')
//     .pipe(sass())
//     .pipe(gulp.dest('css'));
//});

//Concatenate & Minify JS
gulp.task('scripts', function() {

    gulp.src('test/minty-taste-tester.js').pipe(mocha({
        reporter : 'spec'
    }));

    gulp.src(appSrc)
    // file 1
        .pipe(replace("requires.js", "requires.min.js"))
        .pipe(rename('argumints.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build'));

    //file 0 - requirements used by argumints
    gulp.src('requires.js')
        .pipe(replace('.js"', '.min.js"'))
        .pipe(rename('requires.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build'));

    // file 1
    gulp.src('aux_utils.js')
        .pipe(replace('.js"', '.min.js"'))
        .pipe(rename('aux_utils.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build'));

    // file 3
    gulp.src('argumints-builtins.js')
        .pipe(replace('.js"', '.min.js"'))
        .pipe(rename('argumints-builtins.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build'));

    // file 4
    gulp.src('exception.js')
        .pipe(replace('.js"', '.min.js"'))
        .pipe(rename('exception.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build'));

    // file 5
    gulp.src('rules.js')
        .pipe(replace('.js"', '.min.js"'))
        .pipe(rename('rules.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build'));

    gulp.src('stats.js')
        .pipe(replace('.js"', '.min.js"'))
        .pipe(rename('stats.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build'));

});

//Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch(appSrc, [ 'lint', 'scripts'
    ]);
    // gulp.watch(cssSrc, ['sass']);
});

//Default Task
gulp.task('default', [ 'lint', 'scripts', 'watch'
]);
