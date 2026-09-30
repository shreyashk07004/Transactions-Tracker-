@echo off
set "APPDIR=%~dp0"
if "%APPDIR:~-1%"=="\" set "APPDIR=%APPDIR:~0,-1%"
set "LNK=%USERPROFILE%\Desktop\SpendLedger.lnk"

powershell -NoProfile -Command ^
  "$s = (New-Object -ComObject WScript.Shell).CreateShortcut('%LNK%');" ^
  "$s.TargetPath = '%APPDIR%\Launch SpendLedger.bat';" ^
  "$s.WorkingDirectory = '%APPDIR%';" ^
  "$s.IconLocation = '%APPDIR%\build\icon.ico';" ^
  "$s.WindowStyle = 7;" ^
  "$s.Description = 'SpendLedger - personal transaction tracker (runs from source)';" ^
  "$s.Save()"

echo.
echo Desktop shortcut created / updated:
echo   %LNK%
echo   points to: %APPDIR%\Launch SpendLedger.bat
echo.
pause
