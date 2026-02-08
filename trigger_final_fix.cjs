
const axios = require('axios');

async function triggerFinalVerification() {
    const url = "https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/meta-webhook?hub.verify_token=LeadFlow_Meta_2026_Premium";
    const current = Math.floor(Date.now() / 1000);

    const payload = {
        entry: [
            {
                id: "61582413060584", // Himanshu Page ID
                time: current,
                changes: [
                    {
                        field: "leadgen",
                        value: {
                            created_time: current,
                            page_id: "61582413060584",
                            form_id: "HIMANSHU_FINAL_FIX_TEST",
                            leadgen_id: "HIMANSHU_LEAD_SUCCESS_" + current,
                            field_data: [
                                { name: "full_name", values: ["Himanshu Success Verification"] },
                                { name: "phone_number", values: ["+917777766666"] },
                                { name: "city", values: ["Chandigarh"] }
                            ]
                        }
                    }
                ]
            }
        ]
    };

    console.log("🚀 Launching FINAL VERIFICATION for Himanshu Team...");
    try {
        const response = await axios.post(url, payload);
        console.log("✅ Webhook Response:", response.data);
    } catch (error) {
        console.error("❌ Webhook Error:", error.response ? error.response.data : error.message);
    }
}

triggerFinalVerification();
