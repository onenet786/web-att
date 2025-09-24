// Using built-in fetch (Node.js 18+)

async function testCheckoutError() {
    try {
        console.log('🔄 Testing checkout API directly...');
        
        // First, let's try to login to get a token
        console.log('🔑 Attempting login...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        const loginResult = await loginResponse.json();
        console.log('📊 Login response:', loginResult);
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResult.error}`);
        }
        
        const token = loginResult.token;
        console.log('✅ Login successful, token obtained');
        
        // Now test checkout
        console.log('🔄 Testing checkout...');
        const checkoutData = {
            employee_code: 'MCS002',
            reason: 'Lunch break',
            date: new Date().toISOString().split('T')[0]
        };
        
        console.log('📋 Checkout data:', checkoutData);
        
        const checkoutResponse = await fetch('http://localhost:3000/api/employee/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(checkoutData)
        });
        
        const checkoutResult = await checkoutResponse.json();
        
        console.log('📊 Checkout response status:', checkoutResponse.status);
        console.log('📊 Checkout response:', checkoutResult);
        
        if (checkoutResponse.ok) {
            console.log('✅ Checkout successful!');
        } else {
            console.log('❌ Checkout failed:', checkoutResult.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('❌ Error details:', error);
    }
}

testCheckoutError();