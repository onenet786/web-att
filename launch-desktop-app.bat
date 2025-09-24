@echo off
echo Starting Employee Attendance Desktop Application...
echo.
echo Please wait while the application loads...
echo.

cd /d "%~dp0"
npm run electron

echo.
echo Application closed.
pause