@echo off
setlocal EnableDelayedExpansion

:ParameterLoop
if x%1 equ x goto :ParameterDone
set parameter=%1
if %parameter:~0,1% equ - goto CheckParameter
:Usage
echo Usage: %0
echo.
echo Options
echo.
echo     -r ^<architecture^>
echo     -v ^<target version^>
echo     -t ^<target platform (node^|electron)^>
echo     -f force install
echo     -p production install
exit /b 1
:NextParameter
shift /1
goto ParameterLoop
:CheckParameter
if "%1" equ "-r" goto ARGV_R
if "%1" equ "-v" goto ARGV_V
if "%1" equ "-t" goto ARGV_T
if "%1" equ "-f" goto ARGV_F
if "%1" equ "-p" goto ARGV_P
goto Usage
:ARGV_R
  shift /1
  set argv_architecture=%1
  goto NextParameter
:ARGV_V
  shift /1
  set argv_target_version=%1
  goto NextParameter
:ARGV_T
  shift /1
  set argv_target_platform=%1
  goto NextParameter
:ARGV_F
  shift /1
  set argv_force=true
  goto NextParameter
:ARGV_P
  shift /1
  set argv_production=true
  goto NextParameter
:ParameterDone
if not defined argv_architecture (goto Usage)
if not defined argv_target_version (goto Usage)
if not defined argv_target_platform (goto Usage)

:: Check that rimraf is installed.
:: We make use of this command line tool to clear
:: saved dependencies since doing so with `del`
:: might return errors due to long paths.
where rimraf >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Dependency missing: rimraf 1>&2
  exit /b 1
)

:: Check that npm is installed.
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Dependency missing: npm 1>&2
  exit /b 1
)

:: Check that bower is installed.
where bower >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Dependency missing: bower 1>&2
  exit /b 1
)

:: Check that python is installed.
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Dependency missing: python 1>&2
  exit /b 1
)

:: We require Visual Studio 2013 specifically since newer versions
:: lack command line build tools such as `lib.exe` and `cl.exe`.
set GYP_MSVS_VERSION=2013

if "%argv_target_platform%"=="electron" (
  set npm_config_disturl=https://atom.io/download/atom-shell
  set npm_config_runtime=electron
)

set npm_config_target=%argv_target_version%

if "%argv_architecture%"=="x86" (
  set npm_config_arch=ia32
) else (
  set npm_config_arch=%electron_arch%
)

set npm_install_opts=--build-from-source

if "%argv_force%"=="true" (
  set npm_install_opts=%npm_install_opts% --force
)

if "%argv_production%"=="true" (
  set npm_install_opts=%npm_install_opts% --production
)

call rimraf node_modules
call npm install %npm_install_opts%

if "%argv_target_platform%"=="electron" (
  call rimraf bower_components
  call bower install --production
)
