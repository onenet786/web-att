const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function fixDatabaseConstraint() {
    let pool;
    
    try {
        console.log('🔧 Starting database constraint fix...');
        
        // Create connection pool
        pool = mysql.createPool(dbConfig);
        
        // Test connection
        await pool.execute('SELECT 1');
        console.log('✅ Connected to MySQL database');
        
        // Check if the unique constraint exists
        const [constraints] = await pool.execute(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'work_records' 
            AND CONSTRAINT_TYPE = 'UNIQUE'
            AND CONSTRAINT_NAME = 'unique_work_record'
        `, [process.env.DB_NAME || 'attendance_system']);
        
        if (constraints.length > 0) {
            console.log('🔍 Found unique constraint "unique_work_record", removing it...');
            
            // Drop the unique constraint
            await pool.execute(`
                ALTER TABLE work_records 
                DROP INDEX unique_work_record
            `);
            
            console.log('✅ Successfully removed unique constraint from work_records table');
            console.log('🎉 Multiple check-ins per day are now allowed!');
        } else {
            console.log('ℹ️  Unique constraint "unique_work_record" not found - database is already updated');
        }
        
    } catch (error) {
        console.error('❌ Error fixing database constraint:', error);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the migration
fixDatabaseConstraint().then(() => {
    console.log('✨ Database constraint fix completed successfully!');
    process.exit(0);
}).catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
});