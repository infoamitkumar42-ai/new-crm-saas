async function testProxy() {
    const url = 'https://www.leadflowcrm.in/supabase/auth/v1/health';
    console.log('Fetching', url);
    try {
        const res = await fetch(url);
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Body:', text);
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

testProxy();
