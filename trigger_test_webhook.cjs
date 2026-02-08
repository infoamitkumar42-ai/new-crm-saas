
const axios = require('axios');

async function triggerWebhook() {
    const url = "https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/meta-webhook?hub.verify_token=LeadFlow_Meta_2026_Premium";
    const current = Math.floor(Date.now() / 1000);

    const payload = {
        entry: [
            {
                id: "61582413060584",
                time: current,
                changes: [
                    {
                        field: "leadgen",
                        value: {
                            created_time: current,
                            page_id: "61582413060584",
                            form_id: "HIMANSHU_FINAL_TEST_999",
                            leadgen_id: "HIMANSHU_LEAD_ID_" + current,
                            field_data: [
                                { name: "full_name", values: ["Himanshu Real Target"] },
                                { name: "phone_number", values: ["+918888877777"] },
                                { name: "city", values: ["Delhi"] }
                            ]
                        }
                    }
                ]
            }
        ]
    };

    console.log("🚀 Triggering Webhook with payload...");
    try {
        const response = await axios.post(url, payload);
        console.log("✅ Webhook Response:", response.data);
    } catch (error) {
        console.error("❌ Webhook Error:", error.response ? error.response.data : error.message);
    }
}

triggerWebhook();
