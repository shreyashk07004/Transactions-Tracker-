@echo off
cd /d "%~dp0"
echo Building latest SpendLedger code...
call npm run rebuild || (echo. & echo BUILD FAILED - see errors above. & pause & exit /b 1)
call npm start
