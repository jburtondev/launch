/* globals require */
"use strict";

var autoprefixer = require("gulp-autoprefixer"),
    babel = require("gulp-babel"),
    browserSync = require("browser-sync").create(),
    bump = require("gulp-bump"),
    clean = require("gulp-clean"),
    cssmin = require("gulp-cssmin"),
    git = require("git-rev"),
    gulp = require("gulp"),
    gutil = require("gulp-util"),
    npmPackage = require("./package.json"),
    reload = browserSync.reload,
    removeEmptyLines = require("gulp-remove-empty-lines"),
    runSequence = require("run-sequence"),
    sass = require("gulp-sass"),
    stripCSSComments = require("gulp-strip-css-comments"),
    uglify = require("gulp-uglify"),
    zip = require("gulp-zip");

gulp.task("clean", function () {
    return gulp.src("dist").pipe(clean());
});

gulp.task("update", function () {
    return gulp.src("bower_components/jquery/dist/jquery.js").pipe(gulp.dest("src/js/vendor/"));
});

gulp.task("copy", function () {
    gulp.src("src/fonts/**/**").pipe(gulp.dest("dist/fonts/"));
    gulp.src("src/images/**/**").pipe(gulp.dest("dist/images/"));
    gulp.src("src/js/**/**").pipe(gulp.dest("dist/js/"));
    return gulp.src("src/**/**.html").pipe(gulp.dest("dist/"));
});

gulp.task("sass", function () {
    return gulp.src("src/scss/style.scss")
        .pipe(sass({
            includePaths: "bower_components/foundation-sites/scss",
            outputStyle: "compact"
        }).on("error", sass.logError))
        .pipe(autoprefixer())
        .pipe(stripCSSComments({
            preserve: false
        }))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest("dist/css"));
});

gulp.task("serve", function () {
    browserSync.init({
        server: {
            baseDir: "./dist/"
        }
    });
});

gulp.task("transpile", function () {
    return gulp.src(["dist/js/**.js", "!dist/js/vendor/**.js"])
        .pipe(babel({
            compact: false,
            presets: ["es2015"]
        }))
        .pipe(gulp.dest("dist/js/"));
});

gulp.task("cssmin", function () {
    return gulp.src("dist/css/**/**.css")
        .pipe(cssmin({
            advanced: true,
            aggressiveMerging: false,
            keepSpecialComments: 0,
            roundingPrecision: -1,
            shorthandCompacting: false
        }))
        .pipe(gulp.dest("dist/css/"));
});

gulp.task("jsmin", function () {
    return gulp.src("dist/js/**/**.js")
        .pipe(uglify({
            mangle: true,
            preserveComments: false,
            quoteStyle: 0,
            screw_ie8: true
        }))
        .on("error", function (error) {
            gutil.log(gutil.colors.red("[Error]"), error.toString());
        })
        .pipe(gulp.dest("dist/js/"));
});

gulp.task("bump", function () {
    return gulp.src("package.json").pipe(bump({ type: "minor" })).pipe(gulp.dest("./"));
});

gulp.task("patch", function () {
    return gulp.src("package.json").pipe(bump({ type: "patch" })).pipe(gulp.dest("./"));
});

gulp.task("archive", function () {
    var timestamp = new Date().toJSON().slice(0, -5).replace(/:|T/g, "-");
    return gulp.src("dist/**/**").pipe(zip(npmPackage.name + ".[" + timestamp + "].zip")).pipe(gulp.dest("."));
});

gulp.task("build", function () {
    runSequence("clean", "sass", "copy");
});

gulp.task("release", function () {
    runSequence("clean", "sass", "copy", "transpile", "cssmin", "jsmin", "archive");
});

gulp.task("default", function () {
    runSequence("build", "serve");
    gulp.watch(["gulpfile.js", "src/**/**"], ["build", "patch", reload]);
});
