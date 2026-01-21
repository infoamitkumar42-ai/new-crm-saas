
const fs = require('fs');
const path = require('path');
const https = require('https');

function loadEnv() {
    try {
        const paths = [
            path.join(process.cwd(), '.env'),
            path.join('C:', 'Users', 'HP', 'Downloads', 'new-crm-saas', '.env')
        ];
        for (const p of paths) {
            if (fs.existsSync(p)) {
                const envContent = fs.readFileSync(p, 'utf8');
                const env = {};
                envContent.split('\n').forEach(line => {
                    const [key, ...parts] = line.split('=');
                    if (key && parts.length > 0) env[key.trim()] = parts.join('=').trim().replace(/^["']|["']$/g, '');
                });
                return env;
            }
        }
    } catch (e) { return process.env; }
    return {};
}

const env = loadEnv();
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = 'vewqzsqddgmkslnuctvb'; // Verified Project ID
const url = `https://${projectRef}.supabase.co/functions/v1/process-backlog`;

console.log(`🚀 Triggering process-backlog Function...`);
console.log(`URL: ${url}`);

const options = {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(url, options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('RESPONSE:');
        console.log(data);
    });
});

req.on('error', (e) => {
    console.error(`❌ ERROR: ${e.message}`);
});

req.end();
