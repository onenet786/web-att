const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    port: process.env.DB_PORT || 3306
};

async function testRecentActivity() {
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database');
        
        // Test the recent activity query
        const [recentActivity] = await connection.execute(`
            SELECT 
                wr.employee_id,
                wr.date,
                wr.check_in_time,
                wr.check_out_time,
                wr.checkout_reason,
                wr.created_at,
                wr.updated_at,
                e.name,
                e.department,
                e.picture
            FROM work_records wr
            JOIN employees e ON wr.employee_id = e.employee_id
            WHERE e.status = 'active' 
            AND (wr.check_in_time IS NOT NULL OR wr.check_out_time IS NOT NULL)
            ORDER BY 
                CASE 
                    WHEN wr.check_out_time IS NOT NULL THEN CONCAT(wr.date, ' ', wr.check_out_time)
                    WHEN wr.check_in_time IS NOT NULL THEN CONCAT(wr.date, ' ', wr.check_in_time)
                    ELSE wr.updated_at
                END DESC
            LIMIT 1
        `);

        console.log('\n🔍 Recent Activity Query Result:');
        console.log('================================================================================');
        
        if (recentActivity.length === 0) {
            console.log('❌ No recent activity found');
            return;
        }

        const activity = recentActivity[0];
        console.log(`📋 Raw Database Record:`);
        console.log(`   Employee ID: ${activity.employee_id}`);
        console.log(`   Name: ${activity.name}`);
        console.log(`   Date: ${activity.date}`);
        console.log(`   Check In: ${activity.check_in_time}`);
        console.log(`   Check Out: ${activity.check_out_time}`);
        console.log(`   Checkout Reason: ${activity.checkout_reason}`);
        console.log(`   Created: ${activity.created_at}`);
        console.log(`   Updated: ${activity.updated_at}`);
        
        // Simulate the API logic
        let action = 'checkin';
        let timestamp = activity.check_in_time;
        let actionDescription = 'Checked In';
        
        // Format the date properly for comparison
        const dateStr = activity.date instanceof Date ? 
            activity.date.toISOString().split('T')[0] : 
            activity.date.toString().split('T')[0];
        
        console.log(`\n📅 Formatted Date String: ${dateStr}`);
        
        // If there's a check-out time and it's more recent than check-in, it's a checkout
        if (activity.check_out_time && activity.check_in_time) {
            const checkinDateTime = new Date(`${dateStr} ${activity.check_in_time}`);
            const checkoutDateTime = new Date(`${dateStr} ${activity.check_out_time}`);
            
            console.log(`\n🕐 Timestamp Comparison:`);
            console.log(`   Check-in DateTime: ${checkinDateTime}`);
            console.log(`   Check-out DateTime: ${checkoutDateTime}`);
            console.log(`   Checkout > Checkin: ${checkoutDateTime > checkinDateTime}`);
            
            if (checkoutDateTime > checkinDateTime) {
                action = 'checkout';
                timestamp = activity.check_out_time;
                actionDescription = activity.checkout_reason ? 
                    `Checked Out (${activity.checkout_reason})` : 'Checked Out';
            }
        } else if (activity.check_out_time && !activity.check_in_time) {
            action = 'checkout';
            timestamp = activity.check_out_time;
            actionDescription = activity.checkout_reason ? 
                `Checked Out (${activity.checkout_reason})` : 'Checked Out';
        }

        console.log(`\n📊 API Response Would Be:`);
        console.log(`   Action: ${action}`);
        console.log(`   Action Description: ${actionDescription}`);
        console.log(`   Timestamp: ${timestamp}`);
        
        // Also check the last few records for MCS001 specifically
        console.log('\n🔍 Last 3 Records for MCS001:');
        console.log('================================================================================');
        
        const [mcs001Records] = await connection.execute(`
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
            WHERE employee_id = 'MCS001' 
            AND date = CURDATE()
            ORDER BY 
                CASE 
                    WHEN check_out_time IS NOT NULL THEN CONCAT(date, ' ', check_out_time)
                    WHEN check_in_time IS NOT NULL THEN CONCAT(date, ' ', check_in_time)
                    ELSE updated_at
                END DESC
            LIMIT 3
        `);
        
        mcs001Records.forEach((record, index) => {
            console.log(`📝 Record ${index + 1}:`);
            console.log(`   ID: ${record.id}`);
            console.log(`   Check In: ${record.check_in_time}`);
            console.log(`   Check Out: ${record.check_out_time}`);
            console.log(`   Checkout Reason: ${record.checkout_reason}`);
            console.log(`   Created: ${record.created_at}`);
            console.log(`   Updated: ${record.updated_at}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

testRecentActivity();