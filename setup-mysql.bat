@echo off
echo ========================================
echo MySQL Setup for Attendance Management System
echo ========================================
echo.

echo Checking for MySQL installation...
echo.

REM Check common MySQL locations
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    echo ✅ Found MySQL Server 8.0
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin
    goto :found_mysql
)

if exist "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe" (
    echo ✅ Found MySQL Server 5.7
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 5.7\bin
    goto :found_mysql
)

if exist "C:\xampp\mysql\bin\mysql.exe" (
    echo ✅ Found XAMPP MySQL
    set MYSQL_PATH=C:\xampp\mysql\bin
    goto :found_mysql
)

if exist "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe" (
    echo ✅ Found WAMP MySQL
    set MYSQL_PATH=C:\wamp64\bin\mysql\mysql8.0.31\bin
    goto :found_mysql
)

echo ❌ MySQL not found in common locations
echo.
echo Please install MySQL using one of these options:
echo.
echo 1. XAMPP (Recommended - Easiest)
echo    - Download from: https://www.apachefriends.org/
echo    - Install and start MySQL from XAMPP Control Panel
echo.
echo 2. MySQL Installer
echo    - Download from: https://dev.mysql.com/downloads/installer/
echo    - Choose "Developer Default" installation
echo.
echo 3. WAMP
echo    - Download from: https://www.wampserver.com/
echo.
echo After installation, run this script again.
echo.
pause
exit /b 1

:found_mysql
echo.
echo MySQL found at: %MYSQL_PATH%
echo.

REM Test MySQL connection
echo Testing MySQL connection...
"%MYSQL_PATH%\mysql.exe" --version
if %errorlevel% neq 0 (
    echo ❌ MySQL command failed
    echo Please make sure MySQL service is running
    echo.
    echo For XAMPP: Start MySQL from XAMPP Control Panel
    echo For MySQL Installer: Start MySQL80 service
    echo.
    pause
    exit /b 1
)

echo ✅ MySQL is working!
echo.

REM Check if MySQL service is running
echo Checking MySQL service status...
sc query MySQL80 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MySQL80 service found
    sc query MySQL80 | findstr "RUNNING" >nul
    if %errorlevel% equ 0 (
        echo ✅ MySQL80 service is running
    ) else (
        echo ⚠️  MySQL80 service is not running
        echo Starting MySQL80 service...
        net start MySQL80
    )
) else (
    echo ℹ️  MySQL80 service not found (might be using different name)
)

echo.
echo ========================================
echo MySQL Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update config.env with your MySQL password
echo 2. Run: npm run init-db
echo 3. Run: npm start
echo.
echo Default MySQL settings:
echo - Host: localhost
echo - Port: 3306
echo - Username: root
echo - Password: (check your installation)
echo.
echo For XAMPP: Password is usually empty
echo For MySQL Installer: Use the password you set during installation
echo.
pause
