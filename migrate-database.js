const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function migrateDatabase() {
    let connection;
    
    try {
        // Connect to MySQL database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'attendance_system',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to MySQL database');

        // Check if new columns exist and add them if they don't
        const columnsToAdd = [
            { name: 'father_name', definition: 'VARCHAR(100)' },
            { name: 'cnic', definition: 'VARCHAR(15) UNIQUE' },
            { name: 'education', definition: 'VARCHAR(200)' },
            { name: 'dob', definition: 'DATE' },
            { name: 'address', definition: 'TEXT' },
            { name: 'reference', definition: 'VARCHAR(200)' },
            { name: 'picture', definition: 'TEXT' }
        ];

        for (const column of columnsToAdd) {
            try {
                // Check if column exists
                const [rows] = await connection.query(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'employees' AND COLUMN_NAME = ?
                `, [process.env.DB_NAME || 'attendance_system', column.name]);

                if (rows.length === 0) {
                    // Column doesn't exist, add it
                    await connection.query(`ALTER TABLE employees ADD COLUMN ${column.name} ${column.definition}`);
                    console.log(`✅ Added column: ${column.name}`);
                } else {
                    console.log(`✅ Column already exists: ${column.name}`);
                }
            } catch (error) {
                console.error(`❌ Error adding column ${column.name}:`, error.message);
            }
        }

        // Add index for CNIC if it doesn't exist
        try {
            await connection.query(`CREATE INDEX idx_cnic ON employees (cnic)`);
            console.log('✅ Added CNIC index');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('✅ CNIC index already exists');
            } else {
                console.error('❌ Error adding CNIC index:', error.message);
            }
        }

        console.log('\n🎉 Database migration completed successfully!');

    } catch (error) {
        console.error('❌ Database migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

migrateDatabase();