const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    port: process.env.DB_PORT || 3306
};

async function debugServerLogic() {
    let connection;
    
    try {
        console.log('🔌 Connecting to MySQL database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database\n');

        const employeeCode = 'MCS002';
        const date = '2025-09-24';

        console.log(`📋 Debugging server logic for: ${employeeCode}`);
        console.log(`Date: ${date}\n`);

        // Test the exact queries used in the server
        console.log('🔍 Step 1: Testing existingRecords query (latest record):');
        const [existingRecords] = await connection.execute(`
            SELECT status, check_in_time, check_out_time, checkout_reason, created_at
            FROM work_records 
            WHERE employee_id = ? AND date = ?
            ORDER BY created_at DESC
            LIMIT 1
        `, [employeeCode, date]);

        if (existingRecords.length > 0) {
            const lastRecord = existingRecords[0];
            console.log('📊 Latest record:', lastRecord);
            console.log(`🔍 Has check_out_time: ${!!lastRecord.check_out_time}`);
            
            if (!lastRecord.check_out_time) {
                console.log('❌ Employee is already checked in - would return early');
                return;
            }
        }

        console.log('\n🔍 Step 2: Testing checkoutRecords query (latest checkout):');
        const [checkoutRecords] = await connection.execute(`
            SELECT checkout_reason, check_out_time
            FROM work_records 
            WHERE employee_id = ? AND date = ? AND check_out_time IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 1
        `, [employeeCode, date]);

        if (checkoutRecords.length > 0) {
            console.log('📊 Latest checkout record:', checkoutRecords[0]);
            console.log(`🔍 checkout_reason: "${checkoutRecords[0].checkout_reason}"`);
            console.log(`🔍 checkout_reason === 'Day off': ${checkoutRecords[0].checkout_reason === 'Day off'}`);
            
            if (checkoutRecords[0].checkout_reason === 'Day off') {
                console.log('✅ Day-off restriction SHOULD be triggered');
            } else {
                console.log('❌ Day-off restriction will NOT be triggered');
            }
        } else {
            console.log('❌ No checkout records found');
        }

        console.log('\n🔍 Step 3: All records for debugging:');
        const [allRecords] = await connection.execute(`
            SELECT id, status, check_in_time, check_out_time, checkout_reason, created_at, updated_at
            FROM work_records 
            WHERE employee_id = ? AND date = ?
            ORDER BY created_at DESC
        `, [employeeCode, date]);

        allRecords.forEach((record, index) => {
            console.log(`📊 Record ${index + 1}:`, {
                id: record.id,
                status: record.status,
                check_in_time: record.check_in_time,
                check_out_time: record.check_out_time,
                checkout_reason: record.checkout_reason,
                created_at: record.created_at
            });
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

debugServerLogic();