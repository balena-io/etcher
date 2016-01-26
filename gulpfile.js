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

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jshintStylish = require('jshint-stylish');
var sass = require('gulp-sass');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var paths = {
  scripts: [
    './tests/**/*.spec.js',
    './lib/**/*.js',
    'gulpfile.js'
  ],
  sass: [
    './lib/scss/**/*.scss'
  ]
};

gulp.task('sass', function() {
  'use strict';

  return gulp.src(paths.sass)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./build/css'));
});

gulp.task('lint', function() {
  'use strict';

  return gulp.src(paths.scripts)
    .pipe(jshint())
    .pipe(jshint.reporter(jshintStylish));
});

gulp.task('javascript', function() {
  'use strict';

  var b = browserify({
    entries: './lib/browser/app.js',

    // No need for Browserify builtins since Electron
    // has access to all NodeJS libraries
    builtins: {}
  });

  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./build/browser/'));
});

gulp.task('watch', [ 'lint', 'javascript', 'sass' ], function() {
  'use strict';

  gulp.watch(paths.scripts, [ 'lint', 'javascript' ]);
  gulp.watch(paths.sass, [ 'sass' ]);
});
