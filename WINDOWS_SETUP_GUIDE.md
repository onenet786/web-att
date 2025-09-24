# Windows Setup Guide - Attendance Management System

## 🚀 Quick Setup Options

### Option 1: XAMPP (Recommended - Easiest)

**Why XAMPP?**
- ✅ One-click installation
- ✅ Includes MySQL, Apache, PHP
- ✅ Easy to start/stop services
- ✅ No complex configuration needed

**Steps:**
1. **Run:** `install-xampp.bat`
2. **Download and install XAMPP**
3. **Start MySQL from XAMPP Control Panel**
4. **Run:** `quick-start.bat`

### Option 2: MySQL Installer

**Steps:**
1. **Run:** `install-mysql-simple.bat`
2. **Download MySQL Installer**
3. **Install with "Developer Default"**
4. **Set root password**
5. **Update `config.env` with your password**
6. **Run:** `quick-start.bat`

### Option 3: Manual Installation

1. **Download MySQL:** https://dev.mysql.com/downloads/installer/
2. **Install MySQL Server**
3. **Set root password**
4. **Update `config.env`**
5. **Run setup commands**

## 📋 Step-by-Step Instructions

### 1. Install MySQL (Choose one method)

#### Method A: XAMPP (Recommended)
```bash
# Run this file
install-xampp.bat
```
- Download XAMPP from the opened webpage
- Install to default location
- Start XAMPP Control Panel
- Click "Start" next to MySQL

#### Method B: MySQL Installer
```bash
# Run this file
install-mysql-simple.bat
```
- Download MySQL Installer from the opened webpage
- Choose "Developer Default" installation
- Set a root password (remember it!)
- Complete installation

### 2. Configure Database

**Edit `config.env` file:**

**For XAMPP:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=attendance_system
DB_PORT=3306
```

**For MySQL Installer:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=attendance_system
DB_PORT=3306
```

### 3. Setup and Run

```bash
# Automated setup
quick-start.bat

# Or manual setup
npm install
npm run init-db
npm start
```

### 4. Access the System

Open your browser and go to: `http://localhost:3000`

## 🔧 Troubleshooting

### Common Issues:

#### "MySQL is not installed"
- **Solution:** Run `install-xampp.bat` or `install-mysql-simple.bat`

#### "Connection refused"
- **XAMPP:** Make sure MySQL is started in XAMPP Control Panel
- **MySQL Installer:** Make sure MySQL service is running

#### "Access denied"
- **Check:** Your password in `config.env`
- **XAMPP:** Leave password empty
- **MySQL Installer:** Use the password you set during installation

#### "Port 3000 in use"
- **Solution:** Change PORT in `config.env` to 3001 or another port

### Service Management:

#### XAMPP:
- Open XAMPP Control Panel
- Click "Start" next to MySQL

#### MySQL Installer:
```bash
# Start MySQL service
net start mysql80

# Stop MySQL service
net stop mysql80
```

## 📊 Database Information

### Default Settings:

**XAMPP:**
- Host: localhost
- Port: 3306
- Username: root
- Password: (empty)

**MySQL Installer:**
- Host: localhost
- Port: 3306
- Username: root
- Password: (what you set during installation)

### Database Structure:
- **Database:** attendance_system
- **Tables:** students, attendance
- **Sample Data:** 3 students included

## 🎯 Quick Commands

```bash
# Check if MySQL is running
mysql --version

# Start the application
npm start

# Initialize database
npm run init-db

# Install dependencies
npm install
```

## 📁 File Overview

- `install-xampp.bat` - XAMPP installation helper
- `install-mysql-simple.bat` - MySQL installer helper
- `quick-start.bat` - Complete automated setup
- `config.env` - Database configuration
- `server.js` - Backend server
- `package.json` - Dependencies

## 🆘 Need Help?

1. **Check the console output** for error messages
2. **Verify MySQL is running** (XAMPP Control Panel or Services)
3. **Check `config.env`** for correct credentials
4. **Try restarting** MySQL service
5. **Run as Administrator** if needed

---

**🎉 Once setup is complete, your Attendance Management System will be running at `http://localhost:3000`!**
