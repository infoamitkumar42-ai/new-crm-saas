const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyToken(token, pageName, pageId) {
    return new Promise((resolve) => {
        const url = `https://graph.facebook.com/v20.0/me?access_token=${token}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const response = JSON.parse(data);
                if (response.error) {
                    resolve({
                        pageName,
                        pageId,
                        status: '🔴 EXPIRED/INVALID',
                        message: response.error.message
                    });
                } else {
                    resolve({
                        pageName,
                        pageId,
                        status: '🟢 ACTIVE',
                        message: `Linked to ${response.name || 'Unknown'}`
                    });
                }
            });
        }).on('error', (err) => {
            resolve({
                pageName,
                pageId,
                status: '⚠️ ERROR',
                message: err.message
            });
        });
    });
}

async function startVerification() {
    console.log('--- 🛡️ VERIFYING META ACCESS TOKENS ---\n');

    const { data: pages, error } = await supabase.from('meta_pages').select('page_name, page_id, access_token');

    if (error) {
        console.error('Error fetching pages:', error);
        return;
    }

    const results = [];
    for (const page of pages) {
        if (!page.access_token) {
            results.push({
                pageName: page.page_name,
                pageId: page.page_id,
                status: '⚪ NO TOKEN',
                message: 'No token found in database'
            });
            continue;
        }
        const result = await verifyToken(page.access_token, page.page_name, page.page_id);
        results.push(result);
    }

    console.table(results);
    console.log('\n--- VERIFICATION COMPLETE ---');
}

startVerification();
