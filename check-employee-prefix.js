const mysql = require('mysql2/promise');

async function checkEmployees() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'attendance_system'
  });
  
  try {
    const [rows] = await pool.execute('SELECT employee_id, name FROM employees ORDER BY employee_id');
    console.log('📋 Current Employee Records:');
    console.log('================================');
    rows.forEach(emp => {
      console.log(`ID: ${emp.employee_id} | Name: ${emp.name}`);
    });
    
    if (rows.length > 0) {
      const firstId = rows[0].employee_id;
      const match = firstId.match(/^([A-Z]+)/);
      const prefix = match ? match[1] : 'Unknown';
      console.log(`\n🏷️  Detected Prefix: ${prefix}`);
      
      // Check all unique prefixes
      const prefixes = new Set();
      rows.forEach(emp => {
        const match = emp.employee_id.match(/^([A-Z]+)/);
        if (match) prefixes.add(match[1]);
      });
      
      console.log(`\n📊 All Prefixes Found: ${Array.from(prefixes).join(', ')}`);
    } else {
      console.log('\n❌ No employees found in database');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkEmployees();