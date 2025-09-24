@echo off
echo ========================================
echo Attendance Management System - Quick Start
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is installed

echo.
echo Checking MySQL installation...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MySQL is not installed!
    echo.
    echo Please install MySQL using one of these options:
    echo 1. XAMPP (Recommended - easier): Run install-xampp.bat
    echo 2. MySQL Installer: Run install-mysql-simple.bat
    echo 3. Manual: Download from https://dev.mysql.com/downloads/installer/
    echo.
    pause
    exit /b 1
)
echo ✅ MySQL is installed

echo.
echo Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo Setting up database...
echo Please make sure MySQL is running and update config.env with your password
echo.
call npm run init-db
if %errorlevel% neq 0 (
    echo ❌ Database setup failed
    echo Please check your MySQL connection settings in config.env
    pause
    exit /b 1
)
echo ✅ Database setup completed

echo.
echo Starting the application...
echo The system will be available at http://localhost:3000
echo.
call npm start
