# MySQL Database Setup Guide

This guide will help you set up the Attendance Management System with MySQL database integration.

## Prerequisites

1. **Node.js** (version 14 or higher)
2. **MySQL Server** (version 5.7 or higher)
3. **npm** (comes with Node.js)

## Step 1: Install MySQL

### Windows:
1. Download MySQL Installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
2. Run the installer and follow the setup wizard
3. Remember your root password

### macOS:
```bash
# Using Homebrew
brew install mysql
brew services start mysql

# Set root password
mysql_secure_installation
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

## Step 2: Configure Database Connection

1. **Edit the configuration file:**
   ```bash
   # Open config.env file
   nano config.env
   ```

2. **Update the database settings:**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   DB_NAME=attendance_system
   DB_PORT=3306

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

3. **Replace `your_mysql_password_here` with your actual MySQL root password**

## Step 3: Install Dependencies

```bash
# Install Node.js dependencies
npm install
```

## Step 4: Initialize Database

```bash
# Create database and tables
npm run init-db
```

This will:
- Create the `attendance_system` database
- Create the required tables (`students` and `attendance`)
- Insert sample data (3 students)

## Step 5: Start the Server

```bash
# Start the application
npm start
```

The server will start on `http://localhost:3000`

## Step 6: Access the Application

1. Open your web browser
2. Navigate to `http://localhost:3000`
3. You should see the Attendance Management System with sample data

## Troubleshooting

### Common Issues:

#### 1. "Connection refused" Error
- **Solution:** Make sure MySQL server is running
  ```bash
  # Windows
  net start mysql
  
  # macOS
  brew services start mysql
  
  # Linux
  sudo systemctl start mysql
  ```

#### 2. "Access denied" Error
- **Solution:** Check your MySQL credentials in `config.env`
- Make sure the password is correct
- Ensure the user has proper privileges

#### 3. "Database doesn't exist" Error
- **Solution:** Run the database initialization script
  ```bash
  npm run init-db
  ```

#### 4. Port 3000 already in use
- **Solution:** Change the port in `config.env`
  ```env
  PORT=3001
  ```

### Database Management:

#### Connect to MySQL:
```bash
mysql -u root -p
```

#### View databases:
```sql
SHOW DATABASES;
```

#### View tables:
```sql
USE attendance_system;
SHOW TABLES;
```

#### View sample data:
```sql
SELECT * FROM students;
SELECT * FROM attendance;
```

## API Endpoints

The system provides the following API endpoints:

### Students:
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Add new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Attendance:
- `GET /api/attendance/:date` - Get attendance for date
- `POST /api/attendance` - Mark attendance
- `POST /api/attendance/bulk` - Bulk mark attendance

### Reports:
- `GET /api/reports/student/:id/:month` - Get student report
- `GET /api/dashboard` - Get dashboard statistics

## Development Mode

For development with auto-restart:
```bash
npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production` in `config.env`
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name attendance-system
   ```

## Backup and Restore

### Backup:
```bash
mysqldump -u root -p attendance_system > backup.sql
```

### Restore:
```bash
mysql -u root -p attendance_system < backup.sql
```

## Security Considerations

1. **Change default passwords**
2. **Use environment variables for sensitive data**
3. **Enable SSL for production**
4. **Regular database backups**
5. **Update dependencies regularly**

## Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify MySQL server is running
3. Check database credentials
4. Ensure all dependencies are installed

---

**🎉 Your Attendance Management System with MySQL is now ready to use!**
