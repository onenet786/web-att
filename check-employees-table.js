const mysql = require('mysql2/promise');

async function checkTables() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'attendance_system'
    });
    
    try {
        console.log('Checking work_records table structure...');
        const [columns] = await pool.execute('DESCRIBE work_records');
        console.log('\nWork_records table columns:');
        columns.forEach(col => {
            console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `KEY: ${col.Key}` : ''}`);
        });
        
        console.log('\nSample work_records data:');
        const [records] = await pool.execute('SELECT * FROM work_records LIMIT 3');
        console.log(records);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkTables();