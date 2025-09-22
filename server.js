const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: './config.env' });

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
app.use(express.static('.'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'employee-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Authentication middleware
const authenticateUser = (req, res, next) => {
    const token = req.session.token || req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

// Role-based access control middleware
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        if (roles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
    };
};

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

// Initialize database connection
async function initDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        
        // Test connection
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL database');
        connection.release();
        
        // Create tables if they don't exist
        await createTables();
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('Please make sure MySQL is running and check your database configuration in config.env');
        process.exit(1);
    }
}

// Create database tables
async function createTables() {
    try {
        // Create users table with roles
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                role ENUM('admin', 'manager', 'user') DEFAULT 'user',
                employee_id VARCHAR(50),
                last_login TIMESTAMP NULL,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_email (email),
                INDEX idx_role (role)
            )
        `);
        
        // Create departments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create positions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS positions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(100) UNIQUE NOT NULL,
                department_id INT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
            )
        `);

        // Create employees table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                father_name VARCHAR(100),
                cnic VARCHAR(15) UNIQUE,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                department VARCHAR(100) NOT NULL,
                position VARCHAR(100) NOT NULL,
                education VARCHAR(200),
                dob DATE,
                address TEXT,
                reference VARCHAR(200),
                picture VARCHAR(500),
                hire_date DATE,
                salary DECIMAL(10,2),
                status ENUM('active', 'inactive', 'terminated') DEFAULT 'active',
                date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_employee_id (employee_id),
                INDEX idx_email (email),
                INDEX idx_department (department),
                INDEX idx_cnic (cnic)
            )
        `);

        // Create work_records table (replaces attendance)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS work_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                status ENUM('present', 'absent', 'late', 'sick_leave', 'vacation') DEFAULT 'absent',
                check_in_time TIME,
                check_out_time TIME,
                hours_worked DECIMAL(4,2),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_work_record (employee_id, date),
                INDEX idx_employee_date (employee_id, date),
                INDEX idx_date (date),
                FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
            )
        `);

        console.log('✅ Database tables created successfully');
        
        // Insert sample data if tables are empty
        await insertSampleData();
        
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
    }
}

// Insert sample data
async function insertSampleData() {
    try {
        // Insert default users if table is empty
        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        if (users[0].count === 0) {
            // Hash passwords for security
            const saltRounds = 10;
            const adminPassword = await bcrypt.hash('admin123', saltRounds);
            const userPassword = await bcrypt.hash('user123', saltRounds);
            
            const defaultUsers = [
                ['admin', adminPassword, 'admin@example.com', 'admin', null],
                ['attendance', userPassword, 'attendance@example.com', 'user', null]
            ];

            for (const user of defaultUsers) {
                await pool.query(
                    'INSERT INTO users (username, password, email, role, employee_id) VALUES (?, ?, ?, ?, ?)',
                    user
                );
            }
            console.log('✅ Default users created successfully');
        }
        
        // Insert sample departments
        const [departments] = await pool.query('SELECT COUNT(*) as count FROM departments');
        if (departments[0].count === 0) {
            const sampleDepartments = [
                ['IT', 'Information Technology Department'],
                ['HR', 'Human Resources Department'],
                ['Finance', 'Finance and Accounting Department'],
                ['Marketing', 'Marketing and Sales Department'],
                ['Operations', 'Operations and Management Department']
            ];

            for (const dept of sampleDepartments) {
                await pool.query(
                    'INSERT INTO departments (name, description) VALUES (?, ?)',
                    dept
                );
            }
            console.log('✅ Sample department data inserted successfully');
        }

        // Insert sample positions
        const [positions] = await pool.query('SELECT COUNT(*) as count FROM positions');
        if (positions[0].count === 0) {
            const samplePositions = [
                ['Software Developer', 1, 'Develops and maintains software applications'],
                ['System Administrator', 1, 'Manages IT infrastructure and systems'],
                ['HR Manager', 2, 'Manages human resources operations'],
                ['HR Assistant', 2, 'Assists with HR administrative tasks'],
                ['Financial Analyst', 3, 'Analyzes financial data and reports'],
                ['Accountant', 3, 'Handles accounting and bookkeeping'],
                ['Marketing Specialist', 4, 'Develops marketing strategies and campaigns'],
                ['Sales Representative', 4, 'Manages client relationships and sales'],
                ['Operations Manager', 5, 'Oversees daily operations'],
                ['Project Manager', 5, 'Manages projects and teams']
            ];

            for (const pos of samplePositions) {
                await pool.query(
                    'INSERT INTO positions (title, department_id, description) VALUES (?, ?, ?)',
                    pos
                );
            }
            console.log('✅ Sample position data inserted successfully');
        }

        // Insert sample employees
        const [employees] = await pool.query('SELECT COUNT(*) as count FROM employees');
        if (employees[0].count === 0) {
            const sampleEmployees = [
                ['EMP001', 'John Doe', 'Michael Doe', '12345-1234567-1', 'john.doe@company.com', '+1234567890', 'IT', 'Software Developer', 'Bachelor in Computer Science', '1990-05-15', '123 Main St, City, Country', 'Jane Reference - HR Manager', '2023-01-15', 75000.00, 'active'],
                ['EMP002', 'Jane Smith', 'Robert Smith', '23456-2345678-2', 'jane.smith@company.com', '+1234567891', 'HR', 'HR Manager', 'Master in Human Resources', '1985-08-22', '456 Oak Ave, City, Country', null, '2022-06-10', 65000.00, 'active'],
                ['EMP003', 'Mike Johnson', 'William Johnson', '34567-3456789-3', 'mike.johnson@company.com', '+1234567892', 'Finance', 'Financial Analyst', 'Bachelor in Finance', '1992-12-03', '789 Pine Rd, City, Country', 'John Smith - Finance Director', '2023-03-20', 60000.00, 'active'],
                ['EMP004', 'Sarah Wilson', 'David Wilson', '45678-4567890-4', 'sarah.wilson@company.com', '+1234567893', 'Marketing', 'Marketing Specialist', 'Bachelor in Marketing', '1988-07-11', '321 Elm St, City, Country', null, '2023-02-01', 55000.00, 'active'],
                ['EMP005', 'David Brown', 'James Brown', '56789-5678901-5', 'david.brown@company.com', '+1234567894', 'IT', 'System Administrator', 'Bachelor in Information Technology', '1987-04-18', '654 Maple Dr, City, Country', 'Tech Lead - IT Department', '2022-11-15', 70000.00, 'active']
            ];

            for (const employee of sampleEmployees) {
                await pool.query(
                    'INSERT INTO employees (employee_id, name, father_name, cnic, email, phone, department, position, education, dob, address, reference, hire_date, salary, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    employee
                );
            }
            
            console.log('✅ Sample employee data inserted successfully');
        }
    } catch (error) {
        console.error('❌ Error inserting sample data:', error.message);
    }
}

// API Routes

// Get all employees
app.get('/api/employees', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM employees ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// Get next available employee ID
app.get('/api/employees/next-id', async (req, res) => {
    try {
        // Get the highest employee ID number
        const [rows] = await pool.execute(`
            SELECT employee_id 
            FROM employees 
            WHERE employee_id REGEXP '^[A-Z]+[0-9]+$' 
            ORDER BY CAST(SUBSTRING(employee_id, LOCATE(REGEXP_REPLACE(employee_id, '[^0-9]', ''), employee_id)) AS UNSIGNED) DESC 
            LIMIT 1
        `);
        
        let nextId;
        if (rows.length === 0) {
            // No employees exist, start with EMP001
            nextId = 'EMP001';
        } else {
            // Extract the numeric part and increment
            const lastId = rows[0].employee_id;
            const match = lastId.match(/^([A-Z]+)(\d+)$/);
            if (match) {
                const prefix = match[1];
                const number = parseInt(match[2]) + 1;
                nextId = prefix + number.toString().padStart(3, '0');
            } else {
                // Fallback if format doesn't match
                nextId = 'EMP001';
            }
        }
        
        res.json({ nextId: nextId });
    } catch (error) {
        console.error('Error generating next employee ID:', error);
        res.status(500).json({ error: 'Failed to generate next employee ID' });
    }
});

// Get employee by ID
app.get('/api/employees/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM employees WHERE employee_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

// Add new employee
app.post('/api/employees', upload.single('picture'), async (req, res) => {
    try {
        console.log('Received request body:', req.body);
        console.log('Received file:', req.file);
        
        const { 
            employee_id, name, email, phone, department, position, 
            hire_date, salary, father_name, cnic, education, dob, 
            address, reference, pictureData 
        } = req.body;
        
        console.log('Extracted fields:', {
            employee_id, name, email, department, position
        });
        
        // Validate required fields
        if (!employee_id || !name || !email || !department || !position) {
            console.log('Missing required fields validation failed');
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate CNIC format if provided
        if (cnic && !/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
            return res.status(400).json({ error: 'Invalid CNIC format. Use XXXXX-XXXXXXX-X format' });
        }

        // Handle picture data (either file upload or base64 from camera)
        let picturePath = null;
        if (req.file) {
            // File upload
            picturePath = `/uploads/${req.file.filename}`;
        } else if (pictureData) {
            // Base64 data from camera
            try {
                const base64Data = pictureData.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                const filename = `employee-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;
                const filepath = path.join(uploadsDir, filename);
                fs.writeFileSync(filepath, buffer);
                picturePath = `/uploads/${filename}`;
            } catch (error) {
                console.error('Error saving base64 image:', error);
            }
        }

        const [result] = await pool.execute(
            `INSERT INTO employees (
                employee_id, name, email, phone, department, position, 
                hire_date, salary, father_name, cnic, education, dob, 
                address, reference, picture, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employee_id, name, email, phone || null, department, position, 
                hire_date || null, salary || null, father_name || null, 
                cnic || null, education || null, dob || null, 
                address || null, reference || null, picturePath, 'active'
            ]
        );

        res.status(201).json({ 
            message: 'Employee added successfully',
            id: result.insertId 
        });
    } catch (error) {
        console.error('Error adding employee:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Employee ID or email already exists' });
        } else {
            res.status(500).json({ error: 'Failed to add employee' });
        }
    }
});

// Update employee
app.put('/api/employees/:id', upload.single('picture'), async (req, res) => {
    try {
        const { 
            name, email, phone, department, position, hire_date, 
            salary, status, father_name, cnic, education, dob, 
            address, reference, pictureData 
        } = req.body;
        
        // Validate CNIC format if provided
        if (cnic && !/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
            return res.status(400).json({ error: 'Invalid CNIC format. Use XXXXX-XXXXXXX-X format' });
        }

        // Handle picture upload
        let picturePath = null;
        if (req.file) {
            // File uploaded via form-data
            picturePath = `/uploads/${req.file.filename}`;
        } else if (pictureData) {
            // Base64 image data
            try {
                const matches = pictureData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
                if (matches) {
                    const imageType = matches[1];
                    const imageBuffer = Buffer.from(matches[2], 'base64');
                    const fileName = `employee_${req.params.id}_${Date.now()}.${imageType}`;
                    const filePath = path.join(uploadsDir, fileName);
                    
                    fs.writeFileSync(filePath, imageBuffer);
                    picturePath = `/uploads/${fileName}`;
                }
            } catch (err) {
                console.error('Error processing base64 image:', err);
            }
        }
        
        // Build dynamic query based on whether picture is being updated
        let query, params;
        if (picturePath !== null) {
            query = `UPDATE employees SET 
                name = ?, email = ?, phone = ?, department = ?, position = ?, 
                hire_date = ?, salary = ?, status = ?, father_name = ?, 
                cnic = ?, education = ?, dob = ?, address = ?, reference = ?, picture = ? 
            WHERE employee_id = ?`;
            params = [
                name, email, phone || null, department, position, 
                hire_date || null, salary || null, status || 'active', 
                father_name || null, cnic || null, education || null, 
                dob || null, address || null, reference || null, picturePath, req.params.id
            ];
        } else {
            query = `UPDATE employees SET 
                name = ?, email = ?, phone = ?, department = ?, position = ?, 
                hire_date = ?, salary = ?, status = ?, father_name = ?, 
                cnic = ?, education = ?, dob = ?, address = ?, reference = ? 
            WHERE employee_id = ?`;
            params = [
                name, email, phone || null, department, position, 
                hire_date || null, salary || null, status || 'active', 
                father_name || null, cnic || null, education || null, 
                dob || null, address || null, reference || null, req.params.id
            ];
        }

        const [result] = await pool.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        console.error('Error updating employee:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: 'Failed to update employee' });
        }
    }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM employees WHERE employee_id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

// Get departments for dropdown
app.get('/api/departments', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM departments ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// Add new department
app.post('/api/departments', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Department name is required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO departments (name, description) VALUES (?, ?)',
            [name, description || null]
        );

        res.status(201).json({ 
            message: 'Department added successfully',
            id: result.insertId 
        });
    } catch (error) {
        console.error('Error adding department:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Department name already exists' });
        } else {
            res.status(500).json({ error: 'Failed to add department' });
        }
    }
});

// Get positions for dropdown
app.get('/api/positions', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM positions ORDER BY title');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching positions:', error);
        res.status(500).json({ error: 'Failed to fetch positions' });
    }
});

// Add new position
app.post('/api/positions', async (req, res) => {
    try {
        const { title, description } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Position title is required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO positions (title, description) VALUES (?, ?)',
            [title, description || null]
        );

        res.status(201).json({ 
            message: 'Position added successfully',
            id: result.insertId 
        });
    } catch (error) {
        console.error('Error adding position:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Position title already exists' });
        } else {
            res.status(500).json({ error: 'Failed to add position' });
        }
    }
});

// Get work records for a specific date
app.get('/api/work-records/:date', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.employee_id, e.name, e.department, e.position, w.status, w.check_in_time, w.check_out_time, w.hours_worked, w.notes
            FROM employees e
            LEFT JOIN work_records w ON e.employee_id = w.employee_id AND w.date = ?
            WHERE e.status = 'active'
            ORDER BY e.name
        `, [req.params.date]);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching work records:', error);
        res.status(500).json({ error: 'Failed to fetch work records' });
    }
});

// Mark work record
app.post('/api/work-records', async (req, res) => {
    try {
        const { employee_id, date, status, check_in_time, check_out_time, hours_worked, notes } = req.body;
        
        if (!employee_id || !date || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await pool.execute(`
            INSERT INTO work_records (employee_id, date, status, check_in_time, check_out_time, hours_worked, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            check_in_time = VALUES(check_in_time),
            check_out_time = VALUES(check_out_time),
            hours_worked = VALUES(hours_worked),
            notes = VALUES(notes),
            updated_at = CURRENT_TIMESTAMP
        `, [employee_id, date, status, check_in_time || null, check_out_time || null, hours_worked || null, notes || null]);

        res.json({ message: 'Work record marked successfully' });
    } catch (error) {
        console.error('Error marking work record:', error);
        res.status(500).json({ error: 'Failed to mark work record' });
    }
});

// Bulk mark work records
app.post('/api/work-records/bulk', async (req, res) => {
    try {
        const { date, work_records_data } = req.body;
        
        if (!date || !work_records_data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (const { employee_id, status, check_in_time, check_out_time, hours_worked, notes } of work_records_data) {
                await connection.execute(`
                    INSERT INTO work_records (employee_id, date, status, check_in_time, check_out_time, hours_worked, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    check_in_time = VALUES(check_in_time),
                    check_out_time = VALUES(check_out_time),
                    hours_worked = VALUES(hours_worked),
                    notes = VALUES(notes),
                    updated_at = CURRENT_TIMESTAMP
                `, [employee_id, date, status, check_in_time || null, check_out_time || null, hours_worked || null, notes || null]);
            }

            await connection.commit();
            res.json({ message: 'Bulk work records marked successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error marking bulk work records:', error);
        res.status(500).json({ error: 'Failed to mark bulk work records' });
    }
});

// Get work report for an employee
app.get('/api/reports/employee/:employee_id/:month', async (req, res) => {
    try {
        const { employee_id, month } = req.params;
        const year = month.split('-')[0];
        const monthNum = month.split('-')[1];
        
        const [rows] = await pool.execute(`
            SELECT date, status, check_in_time, check_out_time, hours_worked, notes
            FROM work_records
            WHERE employee_id = ? AND YEAR(date) = ? AND MONTH(date) = ?
            ORDER BY date
        `, [employee_id, year, monthNum]);

        // Get employee info
        const [employeeInfo] = await pool.execute('SELECT * FROM employees WHERE employee_id = ?', [employee_id]);
        
        if (employeeInfo.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({
            employee: employeeInfo[0],
            work_records: rows,
            month: month
        });
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});

// Get total employee report for a specific month
app.get('/api/reports/total/:month', async (req, res) => {
    try {
        const { month } = req.params;
        const [year, monthNum] = month.split('-');
        
        // Get total active employees
        const [totalEmployeesResult] = await pool.execute('SELECT COUNT(*) as count FROM employees WHERE status = "active"');
        const totalEmployees = totalEmployeesResult[0].count;
        
        // Get all employees with their work records for the month
        const [employeeData] = await pool.execute(`
            SELECT 
                e.employee_id,
                e.name,
                COUNT(wr.date) as totalDays,
                SUM(CASE WHEN wr.status = 'present' THEN 1 ELSE 0 END) as presentDays,
                SUM(CASE WHEN wr.status = 'absent' THEN 1 ELSE 0 END) as absentDays,
                SUM(CASE WHEN wr.status = 'sick_leave' THEN 1 ELSE 0 END) as sickLeaveDays,
                SUM(CASE WHEN wr.status = 'vacation' THEN 1 ELSE 0 END) as vacationDays
            FROM employees e
            LEFT JOIN work_records wr ON e.employee_id = wr.employee_id 
                AND YEAR(wr.date) = ? AND MONTH(wr.date) = ?
            WHERE e.status = 'active'
            GROUP BY e.employee_id, e.name
            ORDER BY e.name
        `, [year, monthNum]);
        
        // Calculate days in month
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        
        // Process employee data and calculate totals
        let totalPresentDays = 0;
        let totalAbsentDays = 0;
        
        const employeeSummary = employeeData.map(emp => {
            const presentDays = parseInt(emp.presentDays) || 0;
            const absentDays = daysInMonth - presentDays; // Calculate absent as total days minus present days
            const attendanceRate = daysInMonth > 0 ? Math.round((presentDays / daysInMonth) * 100) : 0;
            
            totalPresentDays += presentDays;
            totalAbsentDays += absentDays;
            
            return {
                employee_id: emp.employee_id,
                name: emp.name,
                presentDays: presentDays,
                absentDays: absentDays,
                attendanceRate: Math.min(attendanceRate, 100) // Cap at 100%
            };
        });
        
        // Calculate average attendance rate (ensure it doesn't exceed 100%)
        const averageAttendanceRate = totalEmployees > 0 && daysInMonth > 0 ? 
            Math.min(Math.round((totalPresentDays / (totalEmployees * daysInMonth)) * 100), 100) : 0;
        
        res.json({
            totalEmployees: totalEmployees,
            totalPresentDays: totalPresentDays,
            totalAbsentDays: totalAbsentDays,
            averageAttendanceRate: averageAttendanceRate,
            employeeSummary: employeeSummary,
            month: month,
            daysInMonth: daysInMonth
        });
    } catch (error) {
        console.error('Error fetching total report:', error);
        res.status(500).json({ error: 'Failed to fetch total report' });
    }
});

// Get daily attendance report for all employees
app.get('/api/reports/daily/:date', async (req, res) => {
    try {
        const { date } = req.params;
        
        // Validate date format
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        // Get all employees with their work records for the specified date
        const [employees] = await pool.execute(`
            SELECT 
                e.employee_id,
                e.name,
                e.department,
                e.position,
                COALESCE(wr.status, 'absent') as status,
                wr.check_in_time,
                wr.check_out_time,
                wr.notes
            FROM employees e
            LEFT JOIN work_records wr ON e.employee_id = wr.employee_id AND wr.date = ?
            WHERE e.status = 'active'
            ORDER BY e.department, e.name
        `, [date]);

        // Calculate summary statistics
        const totalEmployees = employees.length;
        const presentCount = employees.filter(emp => emp.status === 'present').length;
        const absentCount = employees.filter(emp => emp.status === 'absent').length;
        const lateCount = employees.filter(emp => emp.status === 'late').length;
        const sickLeaveCount = employees.filter(emp => emp.status === 'sick_leave').length;
        const vacationCount = employees.filter(emp => emp.status === 'vacation').length;
        
        // Calculate attendance rate (present + late employees are considered attending)
        const attendingCount = presentCount + lateCount;

        // Group employees by department
        const departmentGroups = {};
        employees.forEach(emp => {
            if (!departmentGroups[emp.department]) {
                departmentGroups[emp.department] = [];
            }
            departmentGroups[emp.department].push(emp);
        });

        res.json({
            date: date,
            summary: {
                totalEmployees,
                present: presentCount,
                absent: absentCount,
                late: lateCount,
                sickLeave: sickLeaveCount,
                vacation: vacationCount,
                attendanceRate: totalEmployees > 0 ? Math.round((attendingCount / totalEmployees) * 100) : 0
            },
            employees: employees,
            departmentGroups: departmentGroups
        });
    } catch (error) {
        console.error('Error fetching daily report:', error);
        res.status(500).json({ error: 'Failed to fetch daily report' });
    }
});

// Get dashboard statistics
app.get('/api/dashboard', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get total employees
        const [totalEmployees] = await pool.execute('SELECT COUNT(*) as count FROM employees WHERE status = "active"');
        
        // Get today's work records
        const [todayWorkRecords] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = 'sick_leave' THEN 1 ELSE 0 END) as sick_leave,
                SUM(CASE WHEN status = 'vacation' THEN 1 ELSE 0 END) as vacation
            FROM work_records 
            WHERE date = ?
        `, [today]);

        // Get recent activities
        const [recentActivities] = await pool.execute(`
            SELECT 'work_record' as type, date, COUNT(*) as count
            FROM work_records 
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY date
            ORDER BY date DESC
            LIMIT 5
        `);

        res.json({
            totalEmployees: totalEmployees[0].count,
            todayWorkRecords: todayWorkRecords[0],
            recentActivities: recentActivities
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve the index page (protected)
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the attendance page (protected)
app.get('/attendance.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'attendance.html'));
});

// Authentication API endpoints

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Find user in database
        const [users] = await pool.execute('SELECT * FROM users WHERE username = ? AND status = "active"', [username]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const user = users[0];
        
        // Compare password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Create token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Update last login
        await pool.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        
        // Set session
        req.session.token = token;
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
});

// Register endpoint (admin only)
app.post('/api/auth/register', authenticateUser, authorizeRole(['admin']), async (req, res) => {
    try {
        const { username, password, email, role, employee_id } = req.body;
        
        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Username, password, and email are required' });
        }
        
        // Check if username or email already exists
        const [existingUsers] = await pool.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Insert new user
        const [result] = await pool.execute(
            'INSERT INTO users (username, password, email, role, employee_id) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, email, role || 'user', employee_id || null]
        );
        
        res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Get current user info
app.get('/api/auth/me', authenticateUser, async (req, res) => {
    try {
        const [users] = await pool.execute('SELECT id, username, email, role, employee_id FROM users WHERE id = ?', [req.user.id]);
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(users[0]);
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ error: 'Failed to fetch user info' });
    }
});

// Attendance API endpoints

// Get attendance for a specific date
app.get('/api/attendance/:date', authenticateUser, async (req, res) => {
    try {
        const { date } = req.params;
        
        // Validate date format
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        // Get all employees with their attendance records for the specified date
        const [employees] = await pool.execute(`
            SELECT 
                e.employee_id,
                e.name,
                e.department,
                COALESCE(w.status, 'absent') as status
            FROM employees e
            LEFT JOIN work_records w ON e.employee_id = w.employee_id AND w.date = ?
            WHERE e.status = 'active'
            ORDER BY e.name
        `, [date]);

        res.json(employees);
    } catch (error) {
        console.error('Error fetching attendance data:', error);
        res.status(500).json({ error: 'Failed to fetch attendance data' });
    }
});

// Mark attendance for a single employee
app.post('/api/attendance', authenticateUser, async (req, res) => {
    try {
        const { employee_id, date, status } = req.body;
        
        if (!employee_id || !date || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await pool.execute(`
            INSERT INTO work_records (employee_id, date, status)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            updated_at = CURRENT_TIMESTAMP
        `, [employee_id, date, status]);

        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
});

// Bulk mark attendance
app.post('/api/attendance/bulk', authenticateUser, async (req, res) => {
    try {
        const { records } = req.body;
        
        if (!records || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: 'Invalid records data' });
        }

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (const record of records) {
                const { employee_id, date, status } = record;
                
                if (!employee_id || !date || !status) {
                    throw new Error('Missing required fields in record');
                }
                
                await connection.execute(`
                    INSERT INTO work_records (employee_id, date, status)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    updated_at = CURRENT_TIMESTAMP
                `, [employee_id, date, status]);
            }

            await connection.commit();
            res.json({ message: 'Bulk attendance marked successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error marking bulk attendance:', error);
        res.status(500).json({ error: 'Failed to mark bulk attendance' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
    await initDatabase();
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Attendance Management System with MySQL Database`);
        console.log(`🔗 API endpoints available at http://localhost:${PORT}/api/`);
    });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    if (pool) {
        await pool.end();
        console.log('✅ Database connection closed');
    }
    process.exit(0);
});

startServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
