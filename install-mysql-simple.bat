@echo off
echo ========================================
echo MySQL Installation Helper for Windows
echo ========================================
echo.

echo This script will help you install MySQL for the Attendance Management System.
echo.

echo Step 1: Download MySQL Installer
echo ================================
echo.
echo Please download MySQL Installer from:
echo https://dev.mysql.com/downloads/installer/
echo.
echo Choose: mysql-installer-community-8.0.35.0.msi (or latest version)
echo.

echo Step 2: Installation Instructions
echo ================================
echo.
echo When you run the MySQL Installer:
echo 1. Select "Developer Default" installation type
echo 2. Click "Execute" to install all components
echo 3. Set a root password (REMEMBER THIS PASSWORD!)
echo 4. Complete the installation
echo.

echo Step 3: After Installation
echo ==========================
echo.
echo 1. Update config.env file with your MySQL root password
echo 2. Run: npm run init-db
echo 3. Run: npm start
echo.

echo Alternative: Use XAMPP (Easier Option)
echo =====================================
echo.
echo If you prefer an easier option:
echo 1. Download XAMPP from: https://www.apachefriends.org/
echo 2. Install XAMPP (includes MySQL)
echo 3. Start MySQL from XAMPP Control Panel
echo 4. Update config.env with password: (leave empty for XAMPP default)
echo.

echo Press any key to open MySQL download page...
pause >nul
start https://dev.mysql.com/downloads/installer/

echo.
echo Press any key to exit...
pause >nul
