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

async function testDayOffRestriction() {
    let connection;
    
    try {
        console.log('🔌 Connecting to MySQL database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database\n');

        const employeeCode = 'MCS002';
        const date = '2025-09-24';

        console.log(`📋 Testing day-off checkout restriction for: ${employeeCode}`);
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

        // Step 3: Perform day-off checkout
        console.log('🔍 Step 3: Performing day-off checkout...');
        await connection.execute(`
            UPDATE work_records 
            SET check_out_time = '17:00:00', checkout_reason = 'Day off', hours_worked = '8.00', updated_at = NOW()
            WHERE employee_id = ? AND date = ? AND check_out_time IS NULL
        `, [employeeCode, date]);
        console.log('✅ Performed day-off checkout at 17:00\n');

        // Step 4: Verify checkout record
        console.log('🔍 Step 4: Verifying checkout record...');
        const [checkoutRecord] = await connection.execute(`
            SELECT * FROM work_records 
            WHERE employee_id = ? AND date = ? AND checkout_reason = 'Day off'
        `, [employeeCode, date]);
        
        if (checkoutRecord.length > 0) {
            console.log('📊 Checkout record:', {
                id: checkoutRecord[0].id,
                status: checkoutRecord[0].status,
                check_in_time: checkoutRecord[0].check_in_time,
                check_out_time: checkoutRecord[0].check_out_time,
                checkout_reason: checkoutRecord[0].checkout_reason,
                hours_worked: checkoutRecord[0].hours_worked
            });
        } else {
            console.log('❌ No day-off checkout record found');
            return;
        }

        // Step 5: Get authentication token
        console.log('\n🔍 Step 5: Testing check-in API call (should fail)...');
        console.log('🔑 Getting authentication token...');
        
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Authentication token obtained\n');

        // Step 6: Test check-in API call (should fail)
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
            
            if (checkinResponse.status === 400 && checkinResponse.data.error === 'Cannot check-in after day-off checkout') {
                console.log('✅ SUCCESS: Day-off restriction is working correctly!');
            } else {
                console.log('❌ FAILURE: Check-in was allowed after day-off checkout (this should not happen)');
            }
        } catch (error) {
            if (error.response && error.response.status === 400 && 
                error.response.data.error === 'Cannot check-in after day-off checkout') {
                console.log('✅ SUCCESS: Day-off restriction is working correctly!');
                console.log('📋 Error response:', error.response.data);
            } else {
                console.log('❌ Unexpected error:', error.response ? error.response.data : error.message);
            }
        }

        console.log('\n🎉 Day-off restriction test completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

testDayOffRestriction();