/* eslint-env node */

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');

// Rollup
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const rename = require('gulp-rename');

const sass = require('gulp-sass');
const autoprefixer = require('autoprefixer');
const postcss = require('gulp-postcss');

const moduleName = 'slv-contact';
const paths = {
  js: {
    src: './src/js/**/*',
    main: './src/js/main.js',
    dest: './dist/',
  },
  sass: {
    src: './src/sass/**/*',
    main: './src/sass/main.scss',
    dest: './dist/',
  },
  demo: {
    src: './demo',
  },
};

gulp.task('build:src', () => {
  return rollup({
    entry: paths.js.main,
    sourceMap: true,
    plugins: [
      nodeResolve({ jsnext: true, main: true }),
      commonjs(),
      babel({
        exclude: 'node_modules/**',
        presets: ['es2015-rollup'],
      }),
    ],
  })
  // point to the entry file.
  .pipe(source('main.js', './src'))
  // buffer the output. most gulp plugins, including gulp-sourcemaps, don't support streams.
  .pipe(buffer())
  // tell gulp-sourcemaps to load the inline sourcemap produced by rollup-stream.
  .pipe(sourcemaps.init({ loadMaps: true }))
  // transform the code further here.
  .pipe(rename({ basename: moduleName }))
  // write the sourcemap alongside the output file.
  .pipe(sourcemaps.write('.'))
  // and output to ./dist/main.js as normal.
  .pipe(gulp.dest(paths.js.dest));
});

gulp.task('watch:build:src', () => {
  gulp.watch(paths.js.src, ['build:src']);
});


gulp.task('build:sass', () => {
  return gulp.src(paths.sass.main)
  .pipe(sourcemaps.init())
  .pipe(sass().on('error', sass.logError))
  .pipe(postcss([autoprefixer({ browsers: ['last 15 versions'] })]))
  .pipe(rename({ basename: moduleName }))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(paths.sass.dest));
});

gulp.task('watch:build:sass', () => {
  gulp.watch(paths.sass.src, ['build:sass']);
});

gulp.task('build', [
  'build:src',
  'build:sass',
]);

gulp.task('watch', [
  'watch:build:sass',
  'watch:build:src',
]);

gulp.task('dev', ['build', 'watch']);
