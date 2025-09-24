const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: './config.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    port: process.env.DB_PORT || 3306
};

async function createMySQLBackup() {
    let connection;
    
    try {
        console.log('🔌 Connecting to MySQL database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database\n');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupFileName = `mysql-backup-${timestamp}.sql`;
        const backupPath = path.join(__dirname, 'backups', backupFileName);

        // Create backups directory if it doesn't exist
        const backupsDir = path.join(__dirname, 'backups');
        try {
            await fs.mkdir(backupsDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }

        console.log('📋 Creating database backup...');
        console.log(`📁 Backup file: ${backupFileName}\n`);

        let backupContent = '';
        
        // Add header
        backupContent += `-- MySQL Database Backup\n`;
        backupContent += `-- Database: ${dbConfig.database}\n`;
        backupContent += `-- Generated on: ${new Date().toISOString()}\n`;
        backupContent += `-- Host: ${dbConfig.host}:${dbConfig.port}\n\n`;
        
        backupContent += `SET FOREIGN_KEY_CHECKS=0;\n`;
        backupContent += `SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";\n`;
        backupContent += `SET time_zone = "+00:00";\n\n`;

        // Get all tables
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ?
        `, [dbConfig.database]);

        console.log(`📊 Found ${tables.length} tables to backup:`);
        
        for (const table of tables) {
            const tableName = table.TABLE_NAME;
            console.log(`   - ${tableName}`);
            
            // Get table structure
            const [createTable] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
            backupContent += `-- Table structure for \`${tableName}\`\n`;
            backupContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            backupContent += `${createTable[0]['Create Table']};\n\n`;
            
            // Get table data
            const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
            
            if (rows.length > 0) {
                backupContent += `-- Data for table \`${tableName}\`\n`;
                backupContent += `INSERT INTO \`${tableName}\` VALUES\n`;
                
                const values = rows.map(row => {
                    const rowValues = Object.values(row).map(value => {
                        if (value === null) return 'NULL';
                        if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
                        if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        return value;
                    });
                    return `(${rowValues.join(', ')})`;
                });
                
                backupContent += values.join(',\n') + ';\n\n';
            }
        }
        
        backupContent += `SET FOREIGN_KEY_CHECKS=1;\n`;

        // Write backup file
        await fs.writeFile(backupPath, backupContent, 'utf8');
        
        console.log('\n✅ Database backup completed successfully!');
        console.log(`📁 Backup saved to: ${backupPath}`);
        
        // Get file size
        const stats = await fs.stat(backupPath);
        const fileSizeKB = (stats.size / 1024).toFixed(2);
        console.log(`📊 Backup file size: ${fileSizeKB} KB`);
        
        return backupPath;

    } catch (error) {
        console.error('❌ Error creating backup:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run backup if called directly
if (require.main === module) {
    createMySQLBackup()
        .then(backupPath => {
            console.log(`\n🎉 Backup process completed: ${path.basename(backupPath)}`);
        })
        .catch(error => {
            console.error('❌ Backup failed:', error.message);
            process.exit(1);
        });
}

module.exports = { createMySQLBackup };