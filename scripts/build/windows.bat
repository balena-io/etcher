@echo off

::::
:: Copyright 2016 resin.io
::
:: Licensed under the Apache License, Version 2.0 (the "License");
:: you may not use this file except in compliance with the License.
:: You may obtain a copy of the License at
::
:: http://www.apache.org/licenses/LICENSE-2.0
::
:: Unless required by applicable law or agreed to in writing, software
:: distributed under the License is distributed on an "AS IS" BASIS,
:: WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
:: See the License for the specific language governing permissions and
:: limitations under the License.
::::

set command=%1
set arch=%2
set output_build_directory=etcher-release
set output_directory=%output_build_directory%\installers
set certificate_file=certificate.p12
set certificate_pass=1234
set timestamp_server_url=http://timestamp.comodoca.com

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Validate arguments
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

if "%arch%"=="" (
  echo Usage: %0 [command] [arch] 1>&2
  exit /b 1
)

if "%command%"=="" (
  echo Usage: %0 [command] [arch] 1>&2
  exit /b 1
)

:: Batch conditionals don't support logical operators.
:: Simulate "and" with nested conditions.

if not "%arch%"=="x86" (
  if not "%arch%"=="x64" (
    echo Unknown architecture: %arch% 1>&2
    exit /b 1
  )
)

if not "%command%"=="install" (
  if not "%command%"=="package" (
    if not "%command%"=="all" (
      echo Unknown command: %command% 1>&2
      exit /b 1
    )
  )
)

:: Check that rimraf is installed.
:: We make use of this command line tool to clear
:: saved dependencies since doing so with `del`
:: might return errors due to long paths.
where rimraf >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Dependency missing: rimraf 1>&2
  exit /b 1
)

:: Check that signtool is installed.
where signtool >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Dependency missing: signtool 1>&2
  exit /b 1
)

:: Check that bower is installed.
where bower >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Dependency missing: bower 1>&2
  exit /b 1
)

:: Check that makensis is installed.
where makensis >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Dependency missing: nsis 1>&2
  exit /b 1
)

:: Check that upx is installed.
where upx >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Dependency missing: upx 1>&2
  exit /b 1
)

:: Check that asar is installed.
where asar >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Dependency missing: asar 1>&2
  exit /b 1
)

:: Check that python is installed.
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Dependency missing: python 1>&2
  exit /b 1
)

:: Check that 7z is installed.
where 7z >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Dependency missing: 7z 1>&2
  exit /b 1
)

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Global variables
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

set electron_packager=.\node_modules\.bin\electron-packager.cmd
set electron_builder=.\node_modules\.bin\electron-builder.cmd
set company_name="Resinio Ltd"

if "%arch%"=="x86" (
  set electron_arch=ia32
)

if "%arch%"=="x64" (
  set electron_arch=x64
)

for /f %%i in (' "node -e ""console.log(require('./package.json').devDependencies['electron-prebuilt'])""" ') do (
  set electron_version=%%i
)

for /f %%i in (' "node -e ""console.log(require('./package.json').displayName)""" ') do (
  set application_name=%%i
)

for /f "delims=" %%i in (' "node -e ""console.log(require('./package.json').description)""" ') do (
  set application_description=%%i
)

for /f %%i in (' "node -e ""console.log(require('./package.json').copyright)""" ') do (
  set application_copyright=%%i
)

for /f %%i in (' "node -e ""console.log(require('./package.json').version)""" ') do (
  set etcher_version=%%i
)

for /f %%i in (' "node -v" ') do (
  set node_version=%%i
)

set package_name=Etcher-%etcher_version%-win32-%arch%

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Configure NPM to build native addons for Electron correctly
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:: We require Visual Studio 2013 specifically since newer versions
:: lack command line build tools such as `lib.exe` and `cl.exe`.
set GYP_MSVS_VERSION=2013

set npm_config_disturl=https://atom.io/download/atom-shell
set npm_config_runtime=electron
set npm_config_target=%electron_version%
set npm_config_arch=%electron_arch%
set HOME=%homedrive%%homepath%\.electron-gyp

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Install dependencies
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

if not "%command%"=="package" (
  call rimraf node_modules bower_components
  call npm install --build-from-source
  call bower install --production
)

if "%command%"=="install" (
  exit /b 0
)

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Package application
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

for /f %%i in (' "node .\scripts\packageignore.js" ') do (
  set electron_ignore="%%i"
)

call %electron_packager% . %application_name%^
 --platform=win32^
 --arch=%electron_arch%^
 --version=%electron_version%^
 --ignore=%electron_ignore%^
 --icon="assets/icon.ico"^
 --app-copyright=%application_copyright%^
 --app-version=%etcher_version%^
 --build-version=%etcher_version%^
 --version-string.CompanyName=%company_name%^
 --version-string.FileDescription=%application_name%^
 --version-string.OriginalFilename=%package_name%^
 --version-string.ProductName="%application_name% -- %application_description%"^
 --version-string.InternalName=%application_name%^
 --overwrite^
 --out=%output_build_directory%

set package_output=%output_build_directory%\%package_name%

if not "%arch%"=="%electron_arch%" (
    move %output_build_directory%\Etcher-win32-%electron_arch% %output_build_directory%\Etcher-win32-%arch%
)

move %output_build_directory%\Etcher-win32-%arch% %package_output%

:: Omit *.dll and *.node files from the asar package, otherwise
:: `process.dlopen` and `module.require` can't load them correctly.
call asar pack %package_output%\resources\app %package_output%\resources\app.asar^
 --unpack "{*.dll,*.node}"
call rimraf %package_output%\resources\app

signtool sign^
 /t %timestamp_server_url%^
 /d "%application_name% - %etcher_version%"^
 /f %certificate_file%^
 /p %certificate_pass%^
 %package_output%\Etcher.exe
signtool verify /pa /v %package_output%\Etcher.exe

upx -9 %package_output%\*.dll

cd %package_output%^
 && 7z a -tzip ..\installers\%package_name%.zip *^
 && cd ..\..

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Generate installer
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

set installer_tmp_output=%output_build_directory%\win32-%arch%-tmp-installer
set installer_output=%output_directory%\%package_name%.exe

call %electron_builder% %package_output%^
 --platform=win^
 --out=%installer_tmp_output%

mkdir "%output_directory%"
move "%installer_tmp_output%\%application_name% Setup.exe" "%installer_output%"
rd /s /q "%installer_tmp_output%"

signtool sign^
 /t %timestamp_server_url%^
 /d "%application_name% - %etcher_version%"^
 /f %certificate_file%^
 /p %certificate_pass%^
 %installer_output%
signtool verify /pa /v %installer_output%
