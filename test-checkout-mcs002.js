const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'attendance_system'
};

const JWT_SECRET = 'your-secret-key-here';

async function testCheckoutMCS002() {
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database');
        
        // First, verify MCS002 exists and has an active check-in
        const [activeRecords] = await connection.execute(
            'SELECT * FROM work_records WHERE employee_id = ? AND check_out_time IS NULL ORDER BY created_at DESC',
            ['mcs002']
        );
        
        console.log('\n📊 Active check-in records for MCS002:');
        console.table(activeRecords);
        
        if (activeRecords.length === 0) {
            console.log('❌ No active check-in found for MCS002');
            return;
        }
        
        const activeRecord = activeRecords[0];
        console.log(`\n🔍 Found active record ID: ${activeRecord.id}`);
        
        // Generate a test JWT token for MCS002
        const testToken = jwt.sign(
            { 
                employee_id: 'mcs002',
                name: 'Test User MCS002'
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        console.log('\n🔑 Generated test JWT token for MCS002');
        
        // Simulate the checkout process
        const checkoutTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS format
        const checkoutReason = 'End of shift';
        
        // Calculate hours worked
        const checkinTime = activeRecord.check_in_time;
        const checkinDate = new Date(`1970-01-01T${checkinTime}Z`);
        const checkoutDate = new Date(`1970-01-01T${checkoutTime}Z`);
        
        let hoursWorked = (checkoutDate - checkinDate) / (1000 * 60 * 60);
        if (hoursWorked < 0) hoursWorked += 24; // Handle overnight shifts
        
        console.log(`\n⏰ Check-in time: ${checkinTime}`);
        console.log(`⏰ Check-out time: ${checkoutTime}`);
        console.log(`📊 Hours worked: ${hoursWorked.toFixed(2)}`);
        
        // Update the work record
        const [updateResult] = await connection.execute(
            `UPDATE work_records 
             SET check_out_time = ?, 
                 hours_worked = ?, 
                 checkout_reason = ?, 
                 updated_at = NOW() 
             WHERE id = ?`,
            [checkoutTime, hoursWorked.toFixed(2), checkoutReason, activeRecord.id]
        );
        
        if (updateResult.affectedRows > 0) {
            console.log('\n✅ Checkout successful!');
            
            // Verify the update
            const [updatedRecord] = await connection.execute(
                'SELECT * FROM work_records WHERE id = ?',
                [activeRecord.id]
            );
            
            console.log('\n📋 Updated record:');
            console.table(updatedRecord);
        } else {
            console.log('\n❌ Checkout failed - no rows affected');
        }
        
    } catch (error) {
        console.error('❌ Error during checkout test:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the test
testCheckoutMCS002();