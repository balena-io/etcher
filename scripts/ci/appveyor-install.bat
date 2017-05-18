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

call npm config set spin=false || ( EXIT /B 1 )
call npm install -g uglify-es@3.0.3 || ( EXIT /B 1 )

call choco install nsis -version 2.51 || ( EXIT /B 1 )
call choco install jq || ( EXIT /B 1 )
call choco install curl || ( EXIT /B 1 )

call pip install -r requirements.txt || ( EXIT /B 1 )

call make info || ( EXIT /B 1 )
call make electron-develop || ( EXIT /B 1 )

EXIT /B %ERRORLEVEL%
