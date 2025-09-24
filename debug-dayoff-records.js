const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    port: process.env.DB_PORT || 3306
};

async function debugDayOffRecords() {
    let connection;
    
    try {
        console.log('🔌 Connecting to MySQL database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database\n');

        const employeeCode = 'MCS002';
        const date = '2025-09-24';

        console.log(`📋 Debugging day-off records for: ${employeeCode}`);
        console.log(`Date: ${date}\n`);

        // Get all records for today
        console.log('🔍 All work records for today:');
        const [allRecords] = await connection.execute(`
            SELECT id, employee_id, date, status, check_in_time, check_out_time, 
                   checkout_reason, hours_worked, created_at, updated_at
            FROM work_records 
            WHERE employee_id = ? AND date = ?
            ORDER BY created_at DESC
        `, [employeeCode, date]);

        if (allRecords.length === 0) {
            console.log('❌ No records found for today');
            return;
        }

        allRecords.forEach((record, index) => {
            console.log(`📊 Record ${index + 1}:`, {
                id: record.id,
                status: record.status,
                check_in_time: record.check_in_time,
                check_out_time: record.check_out_time,
                checkout_reason: record.checkout_reason,
                hours_worked: record.hours_worked,
                created_at: record.created_at,
                updated_at: record.updated_at
            });
        });

        // Test the exact query used in the server
        console.log('\n🔍 Testing server query (latest record):');
        const [existingRecords] = await connection.execute(`
            SELECT status, check_in_time, check_out_time, checkout_reason, created_at
            FROM work_records 
            WHERE employee_id = ? AND date = ?
            ORDER BY created_at DESC
            LIMIT 1
        `, [employeeCode, date]);

        if (existingRecords.length > 0) {
            const lastRecord = existingRecords[0];
            console.log('📊 Latest record from server query:', lastRecord);
            console.log(`🔍 checkout_reason value: "${lastRecord.checkout_reason}"`);
            console.log(`🔍 checkout_reason type: ${typeof lastRecord.checkout_reason}`);
            console.log(`🔍 checkout_reason === 'Day off': ${lastRecord.checkout_reason === 'Day off'}`);
            console.log(`🔍 Has check_out_time: ${!!lastRecord.check_out_time}`);
            
            if (lastRecord.checkout_reason === 'Day off') {
                console.log('✅ Day-off restriction should be triggered');
            } else {
                console.log('❌ Day-off restriction will NOT be triggered');
            }
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

debugDayOffRecords();