
const fs = require('fs');
const path = require('path');

function checkEnv() {
    console.log("🔍 Scanning .env for Email Credentials...\n");
    const envPath = path.join(process.cwd(), '.env');

    if (!fs.existsSync(envPath)) {
        console.log("❌ .env file NOT found.");
        return;
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const keys = [];

    content.split('\n').forEach(line => {
        const [key] = line.split('=');
        if (key) {
            const k = key.trim().toUpperCase();
            if (k.includes('MAIL') || k.includes('RESEND') || k.includes('SMTP') || k.includes('SENDGRID')) {
                // Print key name only, not value for security (unless needed for debugging logic)
                keys.push(k);
            }
        }
    });

    if (keys.length > 0) {
        console.log("✅ Found Potential Email Keys:");
        keys.forEach(k => console.log(`   - ${k}`));
    } else {
        console.log("❌ No Email/SMTP keys found in .env");
    }
}

checkEnv();
