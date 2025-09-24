const mysql = require('mysql2/promise');
const axios = require('axios');
require('dotenv').config({ path: './config.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    port: process.env.DB_PORT || 3306
};

const API_BASE_URL = 'http://localhost:3000';

async function testLunchReCheckIn() {
    let connection;
    
    try {
        console.log('🔌 Connecting to MySQL database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database\n');

        const employeeCode = 'MCS002';
        const date = '2025-09-24';

        console.log(`📋 Testing lunch checkout re-check-in for: ${employeeCode}`);
        console.log(`Date: ${date}\n`);

        // Step 1: Clean up existing records
        console.log('🧹 Step 1: Cleaning up existing records for today...');
        await connection.execute(`
            DELETE FROM work_records 
            WHERE employee_id = ? AND date = ?
        `, [employeeCode, date]);
        console.log('✅ Cleaned up existing records\n');

        // Step 2: Create initial check-in record
        console.log('🔍 Step 2: Creating initial check-in record...');
        await connection.execute(`
            INSERT INTO work_records (employee_id, date, status, check_in_time, created_at, updated_at)
            VALUES (?, ?, 'present', '09:00:00', NOW(), NOW())
        `, [employeeCode, date]);
        console.log('✅ Created check-in record at 09:00\n');

        // Step 3: Perform lunch checkout
        console.log('🔍 Step 3: Performing lunch checkout...');
        await connection.execute(`
            UPDATE work_records 
            SET check_out_time = '12:00:00', checkout_reason = 'Lunch', hours_worked = '3.00', updated_at = NOW()
            WHERE employee_id = ? AND date = ? AND check_out_time IS NULL
        `, [employeeCode, date]);
        console.log('✅ Performed lunch checkout at 12:00\n');

        // Step 4: Get authentication token
        console.log('🔍 Step 4: Testing check-in API call (should succeed)...');
        console.log('🔑 Getting authentication token...');
        
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Authentication token obtained\n');

        // Step 5: Test check-in API call (should succeed)
        console.log('📡 Testing check-in API call...');
        try {
            const checkinResponse = await axios.post(`${API_BASE_URL}/api/employee/checkin`, {
                employee_code: employeeCode,
                date: date
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log(`📡 Response status: ${checkinResponse.status}`);
            console.log('📋 Response data:', checkinResponse.data);
            
            if (checkinResponse.status === 200 && checkinResponse.data.reCheckIn === true) {
                console.log('✅ SUCCESS: Re-check-in after lunch checkout is working correctly!');
            } else {
                console.log('❌ FAILURE: Re-check-in after lunch checkout failed');
            }
        } catch (error) {
            console.log('❌ Unexpected error:', error.response ? error.response.data : error.message);
        }

        console.log('\n🎉 Lunch re-check-in test completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

testLunchReCheckIn();