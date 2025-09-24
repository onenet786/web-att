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
                checkout_reason VARCHAR(100),
                hours_worked DECIMAL(4,2),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
                ['EMP001', 'Aqeel Ur Rehman', 'AB Chouwdhar', '12345-1234567-1', 'aaqueel@onenetsol.net', '+1234567890', 'IT', 'Software Developer', 'Bachelor in Computer Science', '1990-05-15', '123 Main St, City, Country', 'Jane Reference - HR Manager', '2023-01-15', 75000.00, 'active'],
                ['EMP002', 'Bilal Aqeel', 'Aqeel Ur Rehman', '23456-2345678-2', 'bilalaaqueel@onenetsol.net', '+1234567891', 'HR', 'HR Manager', 'Master in Human Resources', '1985-08-22', '456 Oak Ave, City, Country', null, '2022-06-10', 65000.00, 'active'],
                ['EMP003', 'Hamza Ateeq', 'Ateeq Ur Rehman', '34567-3456789-3', 'hamz@onenetsol.net', '+1234567892', 'Finance', 'Financial Analyst', 'Bachelor in Finance', '1992-12-03', '789 Pine Rd, City, Country', 'John Smith - Finance Director', '2023-03-20', 60000.00, 'active'],
                ['EMP004', 'Saim Mujeeb', 'Mujeeb Ur Rehman', '45678-4567890-4', 'saim@onenetsol.net', '+1234567893', 'Marketing', 'Marketing Specialist', 'Bachelor in Marketing', '1988-07-11', '321 Elm St, City, Country', null, '2023-02-01', 55000.00, 'active'],
                ['EMP005', 'Ali Aziz', 'Aziz Ur Rehman', '56789-5678901-5', 'aliaziz@onenetsol.net', '+1234567894', 'IT', 'System Administrator', 'Bachelor in Information Technology', '1987-04-18', '654 Maple Dr, City, Country', 'Tech Lead - IT Department', '2022-11-15', 70000.00, 'active'],
                ['EMP005', 'Faiq Mati', 'Mati Ur Rehman', '56789-5678901-5', 'faiq@onenetsol.net', '+1234567894', 'IT', 'System Administrator', 'Bachelor in Information Technology', '1987-04-18', '654 Maple Dr, City, Country', 'Tech Lead - IT Department', '2022-11-15', 70000.00, 'active']

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
            email: user.email,
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

// Get recent activity endpoint (must come before parameterized routes)
app.get('/api/attendance/recent-activity', authenticateUser, async (req, res) => {
    try {
        // Get the most recent work record with employee details
        const [recentActivity] = await pool.execute(`
            SELECT 
                wr.employee_id,
                wr.date,
                wr.check_in_time,
                wr.check_out_time,
                wr.created_at,
                wr.updated_at,
                e.name,
                e.department,
                e.picture
            FROM work_records wr
            JOIN employees e ON wr.employee_id = e.employee_id
            WHERE e.status = 'active' 
            AND (wr.check_in_time IS NOT NULL OR wr.check_out_time IS NOT NULL)
            ORDER BY 
                CASE 
                    WHEN wr.check_out_time IS NOT NULL THEN CONCAT(wr.date, ' ', wr.check_out_time)
                    WHEN wr.check_in_time IS NOT NULL THEN CONCAT(wr.date, ' ', wr.check_in_time)
                    ELSE wr.updated_at
                END DESC
            LIMIT 1
        `);

        if (recentActivity.length === 0) {
            return res.json(null); // No recent activity
        }

        const activity = recentActivity[0];
        
        // Determine if this was a check-in or check-out based on timestamps
        let action = 'checkin';
        let timestamp = activity.check_in_time;
        
        // If there's a check-out time and it's more recent than check-in, it's a checkout
        if (activity.check_out_time && activity.check_in_time) {
            const checkinDateTime = new Date(`${activity.date} ${activity.check_in_time}`);
            const checkoutDateTime = new Date(`${activity.date} ${activity.check_out_time}`);
            
            if (checkoutDateTime > checkinDateTime) {
                action = 'checkout';
                timestamp = activity.check_out_time;
            }
        } else if (activity.check_out_time && !activity.check_in_time) {
            action = 'checkout';
            timestamp = activity.check_out_time;
        }

        // Create full timestamp for the activity - only if timestamp is not null
        let activityTimestamp = null;
        if (timestamp) {
            try {
                activityTimestamp = new Date(`${activity.date} ${timestamp}`);
                // Validate the date is valid
                if (isNaN(activityTimestamp.getTime())) {
                    activityTimestamp = null;
                }
            } catch (error) {
                console.error('Error creating timestamp:', error);
                activityTimestamp = null;
            }
        }

        res.json({
            employee_id: activity.employee_id,
            name: activity.name,
            department: activity.department,
            picture: activity.picture,
            action: action,
            timestamp: activityTimestamp ? activityTimestamp.toISOString() : null,
            date: activity.date
        });

    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
});

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
                e.name as employee_name,
                e.department,
                e.picture,
                CASE 
                    WHEN COUNT(w.id) = 0 THEN 'Absent'
                    WHEN SUM(CASE WHEN w.check_out_time IS NULL THEN 1 ELSE 0 END) > 0 THEN 'Present'
                    WHEN MAX(w.checkout_reason) = 'Day off' THEN 'Day off'
                    WHEN MAX(w.checkout_reason) IN ('Lunch', 'Tea', 'Official Work', 'Personal Work') THEN MAX(w.checkout_reason)
                    ELSE 'Present'
                END as status,
                MIN(w.check_in_time) as check_in_time,
                MAX(w.check_out_time) as check_out_time,
                COALESCE(MAX(w.checkout_reason), 'N/A') as checkout_reason,
                SUM(COALESCE(w.hours_worked, 0)) as total_hours_worked
            FROM employees e
            LEFT JOIN work_records w ON UPPER(e.employee_id) = UPPER(w.employee_id) AND w.date = ?
            WHERE e.status = 'active'
            GROUP BY e.employee_id, e.name, e.department, e.picture
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

// Employee self check-in endpoint
// Employee check-in endpoint
app.post('/api/employee/checkin', authenticateUser, async (req, res) => {
    try {
        const { employee_code, date } = req.body;
        
        if (!employee_code || !date) {
            return res.status(400).json({ error: 'Employee code and date are required' });
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        // Find employee by employee_id (employee code)
        const [employees] = await pool.execute(`
            SELECT employee_id, name, department, status
            FROM employees 
            WHERE employee_id = ? AND status = 'active'
        `, [employee_code]);

        if (employees.length === 0) {
            return res.status(404).json({ error: 'Employee not found or inactive' });
        }

        const employee = employees[0];

        // Check existing records for today
        const [existingRecords] = await pool.execute(`
            SELECT status, check_in_time, check_out_time, checkout_reason, created_at
            FROM work_records 
            WHERE employee_id = ? AND date = ?
            ORDER BY created_at DESC
            LIMIT 1
        `, [employee_code, date]);

        const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        // If there are existing records, check if re-check-in is allowed
        if (existingRecords.length > 0) {
            const lastRecord = existingRecords[0];
            
            // Check for day-off restriction FIRST by looking at the most recent checkout record
            const [checkoutRecords] = await pool.execute(`
                SELECT checkout_reason, check_out_time
                FROM work_records 
                WHERE employee_id = ? AND date = ? AND check_out_time IS NOT NULL
                ORDER BY created_at DESC
                LIMIT 1
            `, [employee_code, date]);
            
            if (checkoutRecords.length > 0 && checkoutRecords[0].checkout_reason === 'Day off') {
                return res.status(400).json({
                    error: 'Cannot check-in after day-off checkout',
                    message: 'Employee cannot check-in on the same day after checking out as "Day off". If you want to check-in again for today please contact Administrator please',
                    employee: employee.name,
                    lastCheckout: checkoutRecords[0].checkout_reason,
                    canReCheckIn: false
                });
            }
            
            // If employee is already checked in (no checkout time), don't allow another check-in
            if (!lastRecord.check_out_time) {
                const checkinTime = lastRecord.check_in_time || 
                                  lastRecord.created_at.toLocaleTimeString('en-US', { 
                                      hour12: false, 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                  });
                
                return res.json({
                    alreadyCheckedIn: true,
                    message: 'Employee is already checked in',
                    employee: employee.name,
                    checkinTime: checkinTime,
                    status: lastRecord.status
                });
            }
            
            // Allow re-check-in for other checkout reasons (Lunch, Tea, etc.)
            // Create a new work record entry
            await pool.execute(`
                INSERT INTO work_records (employee_id, date, status, check_in_time)
                VALUES (?, ?, 'present', ?)
            `, [employee_code, date, currentTime]);

            // Get the previous checkout reason for response
            let previousCheckout = null;
            if (checkoutRecords.length > 0) {
                previousCheckout = checkoutRecords[0].checkout_reason;
            }

            return res.json({
                alreadyCheckedIn: false,
                reCheckIn: true,
                message: 'Re-check-in successful',
                employee: employee.name,
                checkinTime: currentTime,
                status: 'present',
                previousCheckout: previousCheckout
            });
        }

        // First check-in of the day
        await pool.execute(`
            INSERT INTO work_records (employee_id, date, status, check_in_time)
            VALUES (?, ?, 'present', ?)
        `, [employee_code, date, currentTime]);

        res.json({
            alreadyCheckedIn: false,
            reCheckIn: false,
            message: 'Check-in successful',
            employee: employee.name,
            checkinTime: currentTime,
            status: 'present'
        });

    } catch (error) {
        console.error('Error in employee check-in:', error);
        res.status(500).json({ error: 'Failed to process check-in' });
    }
});

// Employee status check endpoint
app.get('/api/employee/status/:employee_code', authenticateUser, async (req, res) => {
    try {
        const { employee_code } = req.params;
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Find employee by employee_id (employee code)
        const [employees] = await pool.execute(`
            SELECT employee_id, name, department, status
            FROM employees 
            WHERE employee_id = ? AND status = 'active'
        `, [employee_code]);

        if (employees.length === 0) {
            return res.status(404).json({ error: 'Employee not found or inactive' });
        }

        // Check if employee is already checked in today (get the latest record)
        const [existingRecords] = await pool.execute(`
            SELECT status, check_in_time, check_out_time, checkout_reason
            FROM work_records 
            WHERE employee_id = ? AND date = ?
            ORDER BY created_at DESC
            LIMIT 1
        `, [employee_code, currentDate]);

        let isCheckedIn = false;
        let checkinTime = null;
        let checkoutTime = null;
        let checkoutReason = null;

        if (existingRecords.length > 0) {
            const record = existingRecords[0];
            checkinTime = record.check_in_time ? 
                record.check_in_time.toString().substring(0, 5) : null;
            checkoutTime = record.check_out_time ? 
                record.check_out_time.toString().substring(0, 5) : null;
            checkoutReason = record.checkout_reason;
            
            // Employee is checked in if there's a check-in time but no check-out time
            isCheckedIn = checkinTime && !checkoutTime;
        }

        res.json({
            employee: employees[0],
            isCheckedIn,
            checkinTime,
            checkoutTime,
            checkoutReason
        });

    } catch (error) {
        console.error('Error checking employee status:', error);
        res.status(500).json({ error: 'Failed to check employee status' });
    }
});

// Employee check-out endpoint
app.post('/api/employee/checkout', authenticateUser, async (req, res) => {
    try {
        console.log('🔄 [CHECKOUT API] Starting checkout process...');
        const { employee_code, reason, date } = req.body;
        console.log('📋 [CHECKOUT API] Request data:', { employee_code, reason, date });
        
        if (!employee_code || !reason || !date) {
            console.log('❌ [CHECKOUT API] Missing required fields');
            return res.status(400).json({ error: 'Employee code, reason, and date are required' });
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            console.log('❌ [CHECKOUT API] Invalid date format:', date);
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        console.log('🔍 [CHECKOUT API] Looking up employee:', employee_code);
        // Find employee by employee_id (employee code)
        const [employees] = await pool.execute(`
            SELECT employee_id, name, department, status
            FROM employees 
            WHERE employee_id = ? AND status = 'active'
        `, [employee_code]);

        console.log('📊 [CHECKOUT API] Employee query result:', employees);

        if (employees.length === 0) {
            console.log('❌ [CHECKOUT API] Employee not found or inactive');
            return res.status(404).json({ error: 'Employee not found or inactive' });
        }

        console.log('✅ [CHECKOUT API] Employee found:', employees[0]);

        console.log('🔍 [CHECKOUT API] Checking for active work record...');
        // Check if employee has an active check-in (no check-out time) for today
        const [existingRecords] = await pool.execute(`
            SELECT id, check_in_time, check_out_time
            FROM work_records 
            WHERE employee_id = ? AND date = ? AND check_out_time IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        `, [employee_code, date]);

        console.log('📊 [CHECKOUT API] Work records query result:', existingRecords);

        if (existingRecords.length === 0) {
            console.log('❌ [CHECKOUT API] No active check-in found');
            return res.status(400).json({ error: 'Employee has not checked in or is already checked out' });
        }

        const record = existingRecords[0];
        console.log('✅ [CHECKOUT API] Active record found:', record);

        const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        console.log('⏰ [CHECKOUT API] Current time:', currentTime);

        // Calculate hours worked if both check-in and check-out times are available
        let hoursWorked = null;
        if (record.check_in_time) {
            const checkinTime = new Date(`1970-01-01T${record.check_in_time}`);
            const checkoutTime = new Date(`1970-01-01T${currentTime}:00`);
            const diffMs = checkoutTime - checkinTime;
            hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
            console.log('📊 [CHECKOUT API] Hours worked calculated:', hoursWorked);
        }

        console.log('💾 [CHECKOUT API] Updating work record...');
        // Update the work record with check-out time and reason
        const updateResult = await pool.execute(`
            UPDATE work_records 
            SET check_out_time = ?, checkout_reason = ?, hours_worked = ?
            WHERE id = ?
        `, [currentTime, reason, hoursWorked, record.id]);

        console.log('📊 [CHECKOUT API] Update result:', updateResult);

        const responseData = {
            message: 'Check-out successful',
            employee: employees[0].name,
            checkoutTime: currentTime,
            reason: reason,
            hoursWorked: hoursWorked,
            canReCheckIn: reason.toLowerCase() !== 'day off'
        };

        console.log('✅ [CHECKOUT API] Checkout successful, sending response:', responseData);
        res.json(responseData);

    } catch (error) {
        console.error('❌ [CHECKOUT API] Error in employee check-out:', error);
        console.error('❌ [CHECKOUT API] Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to process check-out' });
    }
});

// Test endpoint for recent activity (no auth required)
app.get('/api/test/recent-activity', async (req, res) => {
    try {
        // Get the most recent work record with employee details
        const [recentActivity] = await pool.execute(`
            SELECT 
                wr.employee_id,
                wr.date,
                wr.check_in_time,
                wr.check_out_time,
                wr.created_at,
                wr.updated_at,
                e.name,
                e.department,
                e.picture
            FROM work_records wr
            JOIN employees e ON wr.employee_id = e.employee_id
            WHERE e.status = 'active' 
            AND (wr.check_in_time IS NOT NULL OR wr.check_out_time IS NOT NULL)
            ORDER BY 
                CASE 
                    WHEN wr.check_out_time IS NOT NULL THEN CONCAT(wr.date, ' ', wr.check_out_time)
                    WHEN wr.check_in_time IS NOT NULL THEN CONCAT(wr.date, ' ', wr.check_in_time)
                    ELSE wr.updated_at
                END DESC
            LIMIT 1
        `);

        console.log('Test recent activity query result:', recentActivity);

        if (recentActivity.length === 0) {
            console.log('No recent activity found');
            return res.json(null); // No recent activity
        }

        const activity = recentActivity[0];
        console.log('Found activity:', activity);
        
        // Determine if this was a check-in or check-out based on timestamps
        let action = 'checkin';
        let timestamp = activity.check_in_time;
        
        // If there's a check-out time and it's more recent than check-in, it's a checkout
        if (activity.check_out_time && activity.check_in_time) {
            const checkinDateTime = new Date(`${activity.date} ${activity.check_in_time}`);
            const checkoutDateTime = new Date(`${activity.date} ${activity.check_out_time}`);
            
            if (checkoutDateTime > checkinDateTime) {
                action = 'checkout';
                timestamp = activity.check_out_time;
            }
        } else if (activity.check_out_time && !activity.check_in_time) {
            action = 'checkout';
            timestamp = activity.check_out_time;
        }

        // Create full timestamp for the activity - only if timestamp is not null
        let activityTimestamp = null;
        if (timestamp) {
            activityTimestamp = new Date(`${activity.date} ${timestamp}`);
        }

        const result = {
            employee_id: activity.employee_id,
            name: activity.name,
            department: activity.department,
            picture: activity.picture,
            action: action,
            timestamp: activityTimestamp ? activityTimestamp.toISOString() : null,
            date: activity.date
        };

        console.log('Returning result:', result);
        res.json(result);

    } catch (error) {
        console.error('Error fetching test recent activity:', error);
        res.status(500).json({ error: 'Failed to fetch recent activity' });
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
