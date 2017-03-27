@echo off

:: Copyright 2017 resin.io
::
:: Licensed under the Apache License, Version 2.0 (the "License");
:: you may not use this file except in compliance with the License.
:: You may obtain a copy of the License at
::
::   http://www.apache.org/licenses/LICENSE-2.0
::
:: Unless required by applicable law or agreed to in writing, software
:: distributed under the License is distributed on an "AS IS" BASIS,
:: WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
:: See the License for the specific language governing permissions and
:: limitations under the License.

IF "%APPVEYOR_REPO_BRANCH%"=="" (
  ECHO This script is only meant to run in Appveyor CI 1>&2
  EXIT /B 1
)

IF %APPVEYOR_REPO_BRANCH%==master (
  make publish-aws-s3
)

EXIT /B %ERRORLEVEL%
