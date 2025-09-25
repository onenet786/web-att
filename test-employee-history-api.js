const https = require('https');
const http = require('http');

async function testEmployeeHistoryAPI() {
    try {
        console.log('Testing Employee History API...');
        
        // Test with MCS001
        const employeeId = 'MCS001';
        const url = `http://localhost:3000/api/employee/history/${employeeId}`;
        
        const response = await new Promise((resolve, reject) => {
            const req = http.get(url, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        data: data
                    });
                });
            });
            req.on('error', reject);
        });
        
        console.log(`Response status: ${response.status}`);
        
        if (response.ok) {
            const data = JSON.parse(response.data);
            console.log('\n✅ Employee History API Response:');
            console.log('Employee Info:', data.employee);
            console.log(`Total Records: ${data.totalRecords}`);
            console.log('\nFirst 3 History Records:');
            data.history.slice(0, 3).forEach((record, index) => {
                console.log(`${index + 1}. Date: ${record.date}, Status: ${record.status}, Check-in: ${record.check_in_time}, Check-out: ${record.check_out_time}`);
            });
        } else {
            console.log('❌ Error Response:', response.data);
        }
        
    } catch (error) {
        console.error('❌ Error testing Employee History API:', error.message);
    }
}

testEmployeeHistoryAPI();