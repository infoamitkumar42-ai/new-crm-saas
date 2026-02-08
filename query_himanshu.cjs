const https = require('https');

const SUPABASE_URL = 'vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDI3NzIyNiwiZXhwIjoyMDQ5ODUzMjI2fQ.LST6o4OQV55yp73knkZ5MlFH-2xXJjv0NlqCVzyyqTY";

function runQuery(sql) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ query: sql });

        const options = {
            hostname: SUPABASE_URL,
            path: '/rest/v1/rpc/exec_sql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function investigate() {
    console.log('🔍 INVESTIGATING HIMANSHU LEAD COUNT\n');
    console.log('='.repeat(70));

    // Query 1: Himanshu current status
    console.log('\n📊 Query 1: Himanshu Current Status');
    const q1 = `
        SELECT name, email, total_leads_received, total_leads_promised, leads_today
        FROM users WHERE email = 'sharmahimanshu9797@gmail.com'
    `;
    const result1 = await runQuery(q1);
    console.log(result1);

    // Query 2: All Himanshu accounts
    console.log('\n📊 Query 2: All Himanshu Accounts');
    const q2 = `
        SELECT id, name, email, team_code, total_leads_received
        FROM users 
        WHERE name ILIKE '%himanshu%' OR email ILIKE '%himanshu%'
        ORDER BY total_leads_received DESC
    `;
    const result2 = await runQuery(q2);
    console.log(result2);

    // Query 3: Count leads for each
    console.log('\n📊 Query 3: Actual Lead Counts');
    const q3 = `
        SELECT 
            u.name,
            u.email,
            u.total_leads_received as counter,
            COUNT(l.id) as actual_count
        FROM users u
        LEFT JOIN leads l ON l.assigned_to = u.id
        WHERE u.name ILIKE '%himanshu%' OR u.email ILIKE '%himanshu%'
        GROUP BY u.id, u.name, u.email, u.total_leads_received
        ORDER BY u.total_leads_received DESC
    `;
    const result3 = await runQuery(q3);
    console.log(result3);

    console.log('\n' + '='.repeat(70));
}

investigate().catch(console.error);
