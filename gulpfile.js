/*
 * Copyright 2016 Resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const gulp = require('gulp');
const jscs = require('gulp-jscs');
const jshint = require('gulp-jshint');
const jshintStylish = require('jshint-stylish');
const sass = require('gulp-sass');

const paths = {
  scripts: [
    './tests/**/*.spec.js',
    './lib/**/*.js',
    'gulpfile.js'
  ],
  sass: [
    './lib/gui/**/*.scss'
  ],
  sassMain: './lib/gui/scss/main.scss'
};

gulp.task('sass', function() {
  return gulp.src(paths.sassMain)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./build/css'));
});

gulp.task('lint', function() {
  return gulp.src(paths.scripts)
    .pipe(jshint())
    .pipe(jshint.reporter(jshintStylish))
    .pipe(jscs())
    .pipe(jscs.reporter());
});

gulp.task('watch', [ 'lint', 'sass' ], function() {
  gulp.watch(paths.scripts, [ 'lint' ]);
  gulp.watch(paths.sass, [ 'sass' ]);
});
