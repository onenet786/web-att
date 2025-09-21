const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function initDatabase() {
    let connection;
    
    try {
        // Connect to MySQL server (without specifying database)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to MySQL server');

        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'attendance_system';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' created or already exists`);

        // Use the database
        await connection.query(`USE \`${dbName}\``);

        // Create departments table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Departments table created');

        // Create positions table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS positions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Positions table created');

        // Create students table (employees)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                father_name VARCHAR(100),
                cnic VARCHAR(15),
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                education VARCHAR(100),
                dob DATE,
                address TEXT,
                reference TEXT,
                department VARCHAR(100),
                position VARCHAR(100),
                salary DECIMAL(10,2),
                joining_date DATE,
                date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_student_id (student_id),
                INDEX idx_email (email),
                INDEX idx_cnic (cnic)
            )
        `);
        console.log('✅ Students table created');

        // Create attendance table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                status ENUM('present', 'absent', 'late') DEFAULT 'absent',
                check_in_time TIME,
                check_out_time TIME,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_attendance (student_id, date),
                INDEX idx_student_date (student_id, date),
                INDEX idx_date (date),
                FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Attendance table created');

        // Insert sample data
        const [students] = await connection.query('SELECT COUNT(*) as count FROM students');
        const [departments] = await connection.query('SELECT COUNT(*) as count FROM departments');
        const [positions] = await connection.query('SELECT COUNT(*) as count FROM positions');
        
        // Insert sample departments
        if (departments[0].count === 0) {
            const sampleDepartments = [
                'Human Resources',
                'Information Technology',
                'Finance',
                'Marketing',
                'Operations',
                'Sales'
            ];

            for (const dept of sampleDepartments) {
                await connection.query(
                    'INSERT INTO departments (name) VALUES (?)',
                    [dept]
                );
            }
            console.log('✅ Sample departments inserted');
        }

        // Insert sample positions
        if (positions[0].count === 0) {
            const samplePositions = [
                'Manager',
                'Senior Developer',
                'Junior Developer',
                'Analyst',
                'Coordinator',
                'Executive'
            ];

            for (const pos of samplePositions) {
                await connection.query(
                    'INSERT INTO positions (name) VALUES (?)',
                    [pos]
                );
            }
            console.log('✅ Sample positions inserted');
        }
        
        if (students[0].count === 0) {
            const sampleStudents = [
                ['EMP001', 'John Doe', 'Robert Doe', '12345-1234567-1', 'john.doe@email.com', '+1234567890', 'Bachelor Computer Science', '1990-01-15', '123 Main St, City', 'Manager Reference', 'Information Technology', 'Senior Developer', 75000.00, '2023-01-15'],
                ['EMP002', 'Jane Smith', 'Michael Smith', '54321-7654321-2', 'jane.smith@email.com', '+1234567891', 'Master Business Administration', '1988-05-20', '456 Oak Ave, City', '', 'Human Resources', 'Manager', 85000.00, '2023-02-01'],
                ['EMP003', 'Mike Johnson', 'David Johnson', '11111-2222222-3', 'mike.johnson@email.com', '+1234567892', 'Bachelor Finance', '1992-08-10', '789 Pine St, City', 'HR Reference', 'Finance', 'Analyst', 55000.00, '2023-03-01']
            ];

            for (const student of sampleStudents) {
                await connection.query(
                    'INSERT INTO students (student_id, name, father_name, cnic, email, phone, education, dob, address, reference, department, position, salary, joining_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    student
                );
            }
            
            console.log('✅ Sample employee data inserted');
        } else {
            console.log('✅ Sample data already exists');
        }

        console.log('\n🎉 Database initialization completed successfully!');
        console.log('📊 You can now start the server with: npm start');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure MySQL server is running');
        console.log('2. Check your database credentials in config.env');
        console.log('3. Ensure the MySQL user has CREATE DATABASE privileges');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initDatabase();
