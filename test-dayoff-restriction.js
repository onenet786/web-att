const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'attendance_system'
};

async function testDayOffRestriction() {
    let pool;
    
    try {
        console.log('🔌 Connecting to MySQL database...');
        pool = mysql.createPool(dbConfig);
        console.log('✅ Connected to MySQL database\n');

        const testEmployeeCode = 'MCS002';
        const testDate = new Date().toISOString().split('T')[0];
        
        console.log(`📋 Testing day-off checkout restriction for: ${testEmployeeCode}`);
        console.log(`Date: ${testDate}\n`);

        // Step 1: Clean up any existing records for today
        console.log('🧹 Step 1: Cleaning up existing records for today...');
        await pool.execute(`
            DELETE FROM work_records 
            WHERE employee_id = ? AND date = ?
        `, [testEmployeeCode, testDate]);
        console.log('✅ Cleaned up existing records\n');

        // Step 2: Create initial check-in record
        console.log('🔍 Step 2: Creating initial check-in record...');
        const checkinTime = '09:00';
        await pool.execute(`
            INSERT INTO work_records (employee_id, date, status, check_in_time)
            VALUES (?, ?, 'present', ?)
        `, [testEmployeeCode, testDate, checkinTime]);
        console.log(`✅ Created check-in record at ${checkinTime}\n`);

        // Step 3: Perform day-off checkout
        console.log('🔍 Step 3: Performing day-off checkout...');
        const checkoutTime = '17:00';
        const checkoutReason = 'Day off';
        
        // Calculate hours worked
        const checkinDate = new Date(`1970-01-01T${checkinTime}:00Z`);
        const checkoutDate = new Date(`1970-01-01T${checkoutTime}:00Z`);
        let hoursWorked = (checkoutDate - checkinDate) / (1000 * 60 * 60);
        
        await pool.execute(`
            UPDATE work_records 
            SET check_out_time = ?, hours_worked = ?, checkout_reason = ?, updated_at = NOW() 
            WHERE employee_id = ? AND date = ? AND check_out_time IS NULL
        `, [checkoutTime, hoursWorked.toFixed(2), checkoutReason, testEmployeeCode, testDate]);
        
        console.log(`✅ Performed day-off checkout at ${checkoutTime}\n`);

        // Step 4: Verify the checkout record
        console.log('🔍 Step 4: Verifying checkout record...');
        const [checkoutRecord] = await pool.execute(`
            SELECT * FROM work_records 
            WHERE employee_id = ? AND date = ?
            ORDER BY created_at DESC
            LIMIT 1
        `, [testEmployeeCode, testDate]);
        
        if (checkoutRecord.length > 0) {
            const record = checkoutRecord[0];
            console.log('📊 Checkout record:', {
                id: record.id,
                status: record.status,
                check_in_time: record.check_in_time,
                check_out_time: record.check_out_time,
                checkout_reason: record.checkout_reason,
                hours_worked: record.hours_worked
            });
        }

        // Step 5: Test check-in API call (should fail)
        console.log('\n🔍 Step 5: Testing check-in API call (should fail)...');
        
        // First, get a valid token
        console.log('🔑 Getting authentication token...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        const loginResult = await loginResponse.json();
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResult.error}`);
        }
        
        const token = loginResult.token;
        console.log('✅ Authentication token obtained\n');

        // Now test the check-in API
        console.log('📡 Testing check-in API call...');
        const checkinResponse = await fetch('http://localhost:3000/api/employee/checkin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                employee_code: testEmployeeCode,
                date: testDate
            })
        });

        const checkinResult = await checkinResponse.json();
        
        console.log('📡 Response status:', checkinResponse.status);
        console.log('📋 Response data:', checkinResult);

        if (checkinResponse.status === 400 && checkinResult.error === 'Cannot check-in after day-off checkout') {
            console.log('✅ SUCCESS: Day-off restriction is working correctly!');
            console.log('✅ Employee cannot check-in after day-off checkout as expected');
        } else if (checkinResponse.ok) {
            console.log('❌ FAILURE: Check-in was allowed after day-off checkout (this should not happen)');
        } else {
            console.log('❌ UNEXPECTED ERROR:', checkinResult.error || 'Unknown error');
        }

        // Step 6: Test with different checkout reason (should allow check-in)
        console.log('\n🔍 Step 6: Testing with lunch checkout (should allow re-check-in)...');
        
        // Update the checkout reason to "Lunch"
        await pool.execute(`
            UPDATE work_records 
            SET checkout_reason = 'Lunch'
            WHERE employee_id = ? AND date = ?
        `, [testEmployeeCode, testDate]);
        
        console.log('✅ Updated checkout reason to "Lunch"');

        // Test check-in again
        const lunchCheckinResponse = await fetch('http://localhost:3000/api/employee/checkin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                employee_code: testEmployeeCode,
                date: testDate
            })
        });

        const lunchCheckinResult = await lunchCheckinResponse.json();
        
        console.log('📡 Lunch re-check-in response status:', lunchCheckinResponse.status);
        console.log('📋 Lunch re-check-in response data:', lunchCheckinResult);

        if (lunchCheckinResponse.ok) {
            console.log('✅ SUCCESS: Re-check-in after lunch checkout is working correctly!');
        } else {
            console.log('❌ FAILURE: Re-check-in after lunch checkout failed unexpectedly');
        }

        console.log('\n🎉 Day-off restriction test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Error details:', error);
    } finally {
        if (pool) {
            await pool.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the test
testDayOffRestriction();