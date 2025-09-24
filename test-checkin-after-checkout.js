const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    port: process.env.DB_PORT || 3306
};

async function testCheckinAfterCheckout() {
    let pool;
    
    try {
        console.log('🔌 Connecting to MySQL database...');
        pool = mysql.createPool(dbConfig);
        console.log('✅ Connected to MySQL database\n');

        const testEmployeeCode = 'MCS002';
        const testDate = new Date().toISOString().split('T')[0];
        
        console.log(`📋 Testing check-in after checkout scenario for: ${testEmployeeCode}`);
        console.log(`Date: ${testDate}\n`);

        // Step 1: Check current employee status
        console.log('🔍 Step 1: Checking current employee status...');
        const [statusCheck] = await pool.execute(`
            SELECT wr.*, e.name as employee_name
            FROM work_records wr
            JOIN employees e ON wr.employee_id = e.employee_id
            WHERE wr.employee_id = ? AND wr.date = ?
            ORDER BY wr.created_at DESC
            LIMIT 1
        `, [testEmployeeCode, testDate]);

        if (statusCheck.length > 0) {
            const record = statusCheck[0];
            console.log('📊 Current record:', {
                id: record.id,
                status: record.status,
                check_in_time: record.check_in_time,
                check_out_time: record.check_out_time,
                checkout_reason: record.checkout_reason,
                created_at: record.created_at
            });
            
            const isCheckedIn = record.check_out_time === null;
            console.log(`📋 Employee is currently: ${isCheckedIn ? 'CHECKED IN' : 'CHECKED OUT'}\n`);
        } else {
            console.log('❌ No work record found for today\n');
        }

        // Step 2: Simulate check-in attempt
        console.log('🔍 Step 2: Simulating check-in attempt...');
        
        // Check if employee exists and is active
        const [employees] = await pool.execute(`
            SELECT employee_id, name, status 
            FROM employees 
            WHERE employee_id = ? AND status = 'active'
        `, [testEmployeeCode]);

        if (employees.length === 0) {
            console.log('❌ Employee not found or inactive');
            return;
        }

        console.log('✅ Employee found:', employees[0]);

        // Check for existing check-in today
        const [existingRecords] = await pool.execute(`
            SELECT id, check_in_time, check_out_time, status
            FROM work_records 
            WHERE employee_id = ? AND date = ? AND check_out_time IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        `, [testEmployeeCode, testDate]);

        console.log(`📋 Existing active records: ${existingRecords.length}`);
        
        if (existingRecords.length > 0) {
            console.log('❌ Employee already has an active check-in (no check-out time)');
            console.log('📊 Active record:', existingRecords[0]);
            return;
        }

        // Check if employee can re-check-in (has checked out today)
        const [todayRecords] = await pool.execute(`
            SELECT id, check_in_time, check_out_time, checkout_reason, status
            FROM work_records 
            WHERE employee_id = ? AND date = ?
            ORDER BY created_at DESC
        `, [testEmployeeCode, testDate]);

        console.log(`📋 Total records for today: ${todayRecords.length}`);
        
        if (todayRecords.length > 0) {
            console.log('📊 Today\'s records:');
            todayRecords.forEach((record, index) => {
                console.log(`  ${index + 1}. ID: ${record.id}, Status: ${record.status}, Check-in: ${record.check_in_time}, Check-out: ${record.check_out_time}, Reason: ${record.checkout_reason}`);
            });
        }

        // Attempt to create new check-in record
        const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        console.log(`\n⏳ Step 3: Attempting to create new check-in record at ${currentTime}...`);
        
        try {
            const [result] = await pool.execute(`
                INSERT INTO work_records (employee_id, date, status, check_in_time, notes)
                VALUES (?, ?, 'present', ?, 'Re-check-in after checkout')
            `, [testEmployeeCode, testDate, currentTime]);

            console.log('✅ Check-in successful!');
            console.log('📊 Insert result:', { 
                insertId: result.insertId, 
                affectedRows: result.affectedRows 
            });

            // Verify the new record
            const [newRecord] = await pool.execute(`
                SELECT * FROM work_records WHERE id = ?
            `, [result.insertId]);

            console.log('📋 New record created:', newRecord[0]);

        } catch (insertError) {
            console.error('❌ Check-in failed with error:', insertError.message);
            console.error('📋 Error details:', {
                code: insertError.code,
                errno: insertError.errno,
                sqlState: insertError.sqlState,
                sqlMessage: insertError.sqlMessage
            });
        }

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

testCheckinAfterCheckout().catch(console.error);