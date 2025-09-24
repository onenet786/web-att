const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    port: process.env.DB_PORT || 3306
};

async function checkMCS002() {
    const pool = mysql.createPool(dbConfig);
    try {
        console.log('🔍 Checking MCS002 work records...');
        
        // Get today's records for MCS002
        const today = new Date().toISOString().split('T')[0];
        const [records] = await pool.execute(`
            SELECT * FROM work_records 
            WHERE employee_id = ? 
            AND date = ? 
            ORDER BY created_at DESC
        `, ['MCS002', today]);
        
        console.log(`📊 Today's records for MCS002 (${today}):`);
        if (records.length === 0) {
            console.log('❌ No records found for today');
        } else {
            console.table(records);
        }
        
        // Check if employee exists
        const [employee] = await pool.execute(`
            SELECT * FROM employees WHERE employee_id = ?
        `, ['MCS002']);
        
        if (employee.length === 0) {
            console.log('❌ Employee MCS002 not found in database!');
        } else {
            console.log('✅ Employee MCS002 exists:', employee[0].name);
        }
        
        // Check for any records with NULL check_out_time
        const [activeRecords] = await pool.execute(`
            SELECT * FROM work_records 
            WHERE employee_id = ? 
            AND date = ? 
            AND check_out_time IS NULL
            ORDER BY created_at DESC
        `, ['MCS002', today]);
        
        console.log('\n🔄 Active check-ins (no check-out):');
        if (activeRecords.length === 0) {
            console.log('✅ No active check-ins found');
        } else {
            console.table(activeRecords);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

checkMCS002();