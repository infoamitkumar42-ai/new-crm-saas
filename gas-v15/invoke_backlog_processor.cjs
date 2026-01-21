
const fs = require('fs');
const path = require('path');

// Hardcoded paths for reliability
const envPath = 'C:\\Users\\HP\\Downloads\\new-crm-saas\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...parts] = line.split('=');
    if (key && parts.length > 0) env[key.trim()] = parts.join('=').trim().replace(/^["']|["']$/g, '');
});

const FUNCTION_URL = "https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/process-backlog";
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function invokeFunction() {
    console.log(`🚀 Invoking Backlog Processor...`);

    try {
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_KEY}`
            },
            body: JSON.stringify({})
        });

        const text = await response.text();
        console.log(`📡 Status: ${response.status} ${response.statusText}`);

        try {
            const json = JSON.parse(text);
            console.log("✅ Response:", JSON.stringify(json, null, 2));
        } catch (e) {
            console.log("📝 Response (Raw):", text);
        }
    } catch (error) {
        console.error("❌ Invocation Failed:", error);
    }
}

invokeFunction();
