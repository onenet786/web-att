const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'attendance_system'
};

async function testCheckoutAPI() {
    let pool;
    
    try {
        // Create database connection
        pool = mysql.createPool(dbConfig);
        console.log('✅ Connected to MySQL database');
        
        // Test data
        const testEmployeeCode = 'MCS002';
        const testReason = 'Day off';
        const currentDate = new Date().toISOString().split('T')[0];
        
        console.log('\n📋 Testing checkout process for:', testEmployeeCode);
        console.log('Date:', currentDate);
        console.log('Reason:', testReason);
        
        // Step 1: Check if employee exists and is active
        console.log('\n🔍 Step 1: Checking employee status...');
        const [employees] = await pool.execute(`
            SELECT employee_id, name, status 
            FROM employees 
            WHERE employee_id = ? AND status = 'active'
        `, [testEmployeeCode]);
        
        if (employees.length === 0) {
            throw new Error('Employee not found or inactive');
        }
        
        console.log('✅ Employee found:', employees[0]);
        
        // Step 2: Check current work record
        console.log('\n🔍 Step 2: Checking current work record...');
        const [existingRecords] = await pool.execute(`
            SELECT status, check_in_time, check_out_time, checkout_reason
            FROM work_records 
            WHERE employee_id = ? AND date = ?
            ORDER BY created_at DESC
            LIMIT 1
        `, [testEmployeeCode, currentDate]);
        
        if (existingRecords.length === 0) {
            throw new Error('No work record found for today');
        }
        
        const currentRecord = existingRecords[0];
        console.log('📋 Current record:', currentRecord);
        
        if (currentRecord.check_out_time !== null) {
            throw new Error('Employee is already checked out');
        }
        
        if (currentRecord.status !== 'present') {
            throw new Error('Employee is not currently present');
        }
        
        // Step 3: Perform checkout
        console.log('\n⏳ Step 3: Performing checkout...');
        const checkoutTime = new Date().toTimeString().split(' ')[0];
        
        // Calculate hours worked
        const checkinTime = new Date(`1970-01-01T${currentRecord.check_in_time}`);
        const checkoutTimeObj = new Date(`1970-01-01T${checkoutTime}`);
        const hoursWorked = ((checkoutTimeObj - checkinTime) / (1000 * 60 * 60)).toFixed(2);
        
        console.log('Check-in time:', currentRecord.check_in_time);
        console.log('Check-out time:', checkoutTime);
        console.log('Hours worked:', hoursWorked);
        
        // Update the work record
        const [updateResult] = await pool.execute(`
            UPDATE work_records 
            SET check_out_time = ?, checkout_reason = ?, hours_worked = ?
            WHERE employee_id = ? AND date = ? AND check_out_time IS NULL
        `, [checkoutTime, testReason, hoursWorked, testEmployeeCode, currentDate]);
        
        if (updateResult.affectedRows === 0) {
            throw new Error('Failed to update work record');
        }
        
        console.log('✅ Checkout successful!');
        console.log('📊 Update result:', {
            affectedRows: updateResult.affectedRows,
            changedRows: updateResult.changedRows
        });
        
        // Step 4: Verify the update
        console.log('\n🔍 Step 4: Verifying checkout...');
        const [verifyRecords] = await pool.execute(`
            SELECT * FROM work_records 
            WHERE employee_id = ? AND date = ?
            ORDER BY created_at DESC
            LIMIT 1
        `, [testEmployeeCode, currentDate]);
        
        console.log('✅ Verified record:', verifyRecords[0]);
        
        console.log('\n🎉 Checkout test completed successfully!');
        
    } catch (error) {
        console.error('❌ Checkout test failed:', error.message);
        console.error('Error details:', error);
    } finally {
        if (pool) {
            await pool.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the test
testCheckoutAPI();