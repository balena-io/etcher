@echo on
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
echo     -c ^<certificate file (.p12)^>
echo     -p ^<certificate password^>
echo     -f ^<executable file (.exe)^>
echo     -d ^<signature description^>
exit /b 1
:NextParameter
shift /1
goto ParameterLoop
:CheckParameter
if "%1" equ "-c" goto ARGV_C
if "%1" equ "-p" goto ARGV_P
if "%1" equ "-f" goto ARGV_F
if "%1" equ "-d" goto ARGV_D
goto Usage
:ARGV_C
  shift /1
  set argv_certificate=%1
  goto NextParameter
:ARGV_P
  shift /1
  set argv_password=%1
  goto NextParameter
:ARGV_F
  shift /1
  set argv_file=%1
  goto NextParameter
:ARGV_D
  shift /1
  set argv_description=%1
  goto NextParameter
:ParameterDone

if not defined argv_certificate (goto Usage)
if not defined argv_password (goto Usage)
if not defined argv_file (goto Usage)
if not defined argv_description (goto Usage)

:: Check that signtool is installed.
where signtool >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Dependency missing: signtool 1>&2
  exit /b 1
)

signtool sign^
 /t http://timestamp.comodoca.com^
 /d %argv_description%^
 /f %argv_certificate%^
 /p %argv_password%^
 %argv_file%

signtool verify /pa /v %argv_file%
