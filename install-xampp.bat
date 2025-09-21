@echo off
echo ========================================
echo XAMPP Installation (Recommended)
echo ========================================
echo.

echo XAMPP is the easiest way to get MySQL running on Windows.
echo It includes MySQL, Apache, and PHP in one package.
echo.

echo Step 1: Download XAMPP
echo ======================
echo.
echo Download XAMPP from: https://www.apachefriends.org/
echo Choose the Windows version (about 150MB)
echo.

echo Step 2: Install XAMPP
echo ====================
echo.
echo 1. Run the XAMPP installer
echo 2. Install to default location (C:\xampp)
echo 3. Start XAMPP Control Panel
echo 4. Click "Start" next to MySQL
echo.

echo Step 3: Configure Database
echo ==========================
echo.
echo 1. Open config.env file
echo 2. Set DB_PASSWORD= (leave empty for XAMPP default)
echo 3. Run: npm run init-db
echo 4. Run: npm start
echo.

echo XAMPP MySQL Default Settings:
echo - Host: localhost
echo - Port: 3306
echo - Username: root
echo - Password: (empty)
echo.

echo Press any key to open XAMPP download page...
pause >nul
start https://www.apachefriends.org/

echo.
echo After installing XAMPP, run the quick-start.bat file.
echo.
echo Press any key to exit...
pause >nul
