const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    port: process.env.DB_PORT || 3306
};

async function checkMCS001Status() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database');
        
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        console.log(`📅 Checking records for date: ${today}`);
        
        // Check MCS001 work records for today
        const [workRecords] = await connection.execute(`
            SELECT 
                id,
                employee_id,
                date,
                check_in_time,
                check_out_time,
                checkout_reason,
                created_at,
                updated_at
            FROM work_records 
            WHERE employee_id = 'MCS001' AND date = ?
            ORDER BY created_at DESC
        `, [today]);
        
        console.log('\n📊 MCS001 Work Records for Today:');
        console.log('='.repeat(80));
        
        if (workRecords.length === 0) {
            console.log('❌ No work records found for MCS001 today');
        } else {
            workRecords.forEach((record, index) => {
                console.log(`\n📝 Record ${index + 1}:`);
                console.log(`   ID: ${record.id}`);
                console.log(`   Employee ID: ${record.employee_id}`);
                console.log(`   Date: ${record.date}`);
                console.log(`   Check In: ${record.check_in_time || 'NULL'}`);
                console.log(`   Check Out: ${record.check_out_time || 'NULL'}`);
                console.log(`   Checkout Reason: ${record.checkout_reason || 'NULL'}`);
                console.log(`   Created: ${record.created_at}`);
                console.log(`   Updated: ${record.updated_at}`);
            });
        }
        
        // Also check what the attendance API would return
        console.log('\n🔍 Testing Attendance API Logic:');
        console.log('='.repeat(80));
        
        const [attendanceData] = await connection.execute(`
            SELECT 
                e.employee_id,
                e.name as employee_name,
                e.department,
                e.picture,
                CASE 
                    WHEN wr.check_in_time IS NULL THEN 'Absent'
                    WHEN wr.check_out_time IS NULL THEN 'Present'
                    WHEN wr.checkout_reason IS NOT NULL THEN CONCAT('Checked Out (', wr.checkout_reason, ')')
                    ELSE 'Checked Out'
                END as status,
                wr.check_in_time,
                wr.check_out_time,
                wr.checkout_reason
            FROM employees e
            LEFT JOIN work_records wr ON e.employee_id = wr.employee_id AND wr.date = ?
            WHERE e.employee_id = 'MCS001' AND e.status = 'active'
        `, [today]);
        
        if (attendanceData.length > 0) {
            const record = attendanceData[0];
            console.log(`\n📋 API Response for MCS001:`);
            console.log(`   Employee: ${record.employee_name}`);
            console.log(`   Department: ${record.department}`);
            console.log(`   Status: ${record.status}`);
            console.log(`   Check In: ${record.check_in_time || 'NULL'}`);
            console.log(`   Check Out: ${record.check_out_time || 'NULL'}`);
            console.log(`   Checkout Reason: ${record.checkout_reason || 'NULL'}`);
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

checkMCS001Status();