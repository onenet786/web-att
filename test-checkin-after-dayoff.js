const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './config.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    port: process.env.DB_PORT || 3306
};

async function testCheckinAfterDayOff() {
    let pool;
    
    try {
        console.log('🔌 Connecting to MySQL database...');
        pool = mysql.createPool(dbConfig);
        console.log('✅ Connected to MySQL database\n');

        const testEmployeeCode = 'MCS002';
        const testDate = new Date().toISOString().split('T')[0];
        
        console.log(`📋 Testing check-in after "Day off" checkout for: ${testEmployeeCode}`);
        console.log(`Date: ${testDate}\n`);

        // Generate a test JWT token for API calls
        const testToken = jwt.sign(
            { 
                id: 1, 
                username: 'admin', 
                role: 'admin' 
            }, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );

        console.log('🔑 Generated test JWT token for API calls\n');

        // Step 1: Check current status
        console.log('🔍 Step 1: Checking current employee status...');
        const statusResponse = await fetch(`http://localhost:3000/api/employee/status/${testEmployeeCode}`, {
            headers: { 'Authorization': `Bearer ${testToken}` }
        });
        
        const statusResult = await statusResponse.json();
        console.log('📊 Current status:', statusResult);

        // Step 2: Attempt check-in via API
        console.log('\n⏳ Step 2: Attempting check-in via API...');
        
        const checkinResponse = await fetch('http://localhost:3000/api/employee/checkin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testToken}`
            },
            body: JSON.stringify({
                employee_code: testEmployeeCode,
                date: testDate
            })
        });

        const checkinResult = await checkinResponse.json();
        
        console.log('📡 Response status:', checkinResponse.status);
        console.log('📋 Response data:', checkinResult);

        if (checkinResponse.ok) {
            console.log('✅ Check-in successful!');
            
            // Verify the new record was created
            const [newRecords] = await pool.execute(`
                SELECT * FROM work_records 
                WHERE employee_id = ? AND date = ? 
                ORDER BY created_at DESC 
                LIMIT 1
            `, [testEmployeeCode, testDate]);

            if (newRecords.length > 0) {
                console.log('📊 Latest work record:', newRecords[0]);
            }
        } else {
            console.log('❌ Check-in failed:', checkinResult.error);
        }

        // Step 3: Check updated status
        console.log('\n🔍 Step 3: Checking updated employee status...');
        const updatedStatusResponse = await fetch(`http://localhost:3000/api/employee/status/${testEmployeeCode}`, {
            headers: { 'Authorization': `Bearer ${testToken}` }
        });
        
        const updatedStatusResult = await updatedStatusResponse.json();
        console.log('📊 Updated status:', updatedStatusResult);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('📋 Full error:', error);
    } finally {
        if (pool) {
            console.log('\n🔌 Closing database connection...');
            await pool.end();
            console.log('✅ Database connection closed');
        }
    }
}

testCheckinAfterDayOff().catch(console.error);