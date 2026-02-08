
const fetch = require('node-fetch');

const WEBHOOK_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/meta-webhook';

const MOCK_PAYLOAD = {
    "object": "page",
    "entry": [
        {
            "id": "928347267036761",
            "time": 1699999999,
            "changes": [
                {
                    "field": "leadgen",
                    "value": {
                        "created_time": 1699999999,
                        "leadgen_id": "444455556666",
                        "page_id": "928347267036761",
                        "form_id": "123456789",
                        // Simulating MISSING field_data to force Hybrid Flow
                        // "field_data": [] 
                    }
                }
            ]
        }
    ]
};

async function testWebhook() {
    console.log("🚀 Sending Mock Webhook to:", WEBHOOK_URL);
    try {
        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(MOCK_PAYLOAD)
        });

        console.log(`📡 Status Code: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log("📄 Response Body:", text);
    } catch (e) {
        console.error("❌ Network Error:", e.message);
    }
}

testWebhook();
