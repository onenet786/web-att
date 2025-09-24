const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'attendance_system'
};

async function debugEmployeeStatus() {
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database');
        
        const currentDate = new Date().toISOString().split('T')[0];
        console.log(`\n📅 Current date: ${currentDate}`);
        
        // Check all work records for today
        const [allRecords] = await connection.execute(`
            SELECT employee_id, status, check_in_time, check_out_time, checkout_reason, created_at
            FROM work_records 
            WHERE date = ?
            ORDER BY employee_id, created_at DESC
        `, [currentDate]);
        
        console.log('\n📊 All work records for today:');
        console.table(allRecords);
        
        // Test the current logic for MCS002
        const employee_code = 'mcs002';
        console.log(`\n🔍 Testing status check for ${employee_code}:`);
        
        // This is the CURRENT query from server.js (problematic)
        const [existingRecords] = await connection.execute(`
            SELECT status, check_in_time, check_out_time, checkout_reason
            FROM work_records 
            WHERE employee_id = ? AND date = ?
        `, [employee_code, currentDate]);
        
        console.log('\n❌ Current query results (PROBLEMATIC - gets first record):');
        console.table(existingRecords);
        
        if (existingRecords.length > 0) {
            const record = existingRecords[0]; // This gets the FIRST record, not the LATEST!
            const checkinTime = record.check_in_time ? 
                record.check_in_time.toString().substring(0, 5) : null;
            const checkoutTime = record.check_out_time ? 
                record.check_out_time.toString().substring(0, 5) : null;
            
            const isCheckedIn = checkinTime && !checkoutTime;
            
            console.log(`\n📋 Current logic result:`);
            console.log(`   Check-in time: ${checkinTime}`);
            console.log(`   Check-out time: ${checkoutTime}`);
            console.log(`   Is checked in: ${isCheckedIn}`);
        }
        
        // Test the CORRECT query (should get latest record)
        const [latestRecords] = await connection.execute(`
            SELECT status, check_in_time, check_out_time, checkout_reason, created_at
            FROM work_records 
            WHERE employee_id = ? AND date = ?
            ORDER BY created_at DESC
            LIMIT 1
        `, [employee_code, currentDate]);
        
        console.log('\n✅ CORRECT query results (gets LATEST record):');
        console.table(latestRecords);
        
        if (latestRecords.length > 0) {
            const record = latestRecords[0];
            const checkinTime = record.check_in_time ? 
                record.check_in_time.toString().substring(0, 5) : null;
            const checkoutTime = record.check_out_time ? 
                record.check_out_time.toString().substring(0, 5) : null;
            
            const isCheckedIn = checkinTime && !checkoutTime;
            
            console.log(`\n📋 Correct logic result:`);
            console.log(`   Check-in time: ${checkinTime}`);
            console.log(`   Check-out time: ${checkoutTime}`);
            console.log(`   Is checked in: ${isCheckedIn}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the debug
debugEmployeeStatus();