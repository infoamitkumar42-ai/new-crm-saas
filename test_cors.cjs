async function testCORS() {
    const url = 'https://www.leadflowcrm.in/supabase/auth/v1/health';
    console.log('Fetching OPTIONS', url);
    try {
        const res = await fetch(url, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://www.leadflowcrm.in',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'apikey, authorization'
            }
        });
        console.log('Status:', res.status);
        console.log('Headers:');
        res.headers.forEach((val, key) => console.log(`${key}: ${val}`));
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

testCORS();
