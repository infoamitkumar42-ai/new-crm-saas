
const axios = require('axios');

async function finalGoldenTest() {
    const url = "https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/meta-webhook?hub.verify_token=LeadFlow_Meta_2026_Premium";
    const current = Math.floor(Date.now() / 1000);

    // Using HIMANSHU page ID
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
                            form_id: "GOLDEN_FORM_FIXED",
                            leadgen_id: "GOLDEN_ID_" + current,
                            field_data: [
                                { name: "full_name", values: ["Himanshu Golden Verification"] },
                                { name: "phone_number", values: ["+917711223344"] },
                                { name: "city", values: ["Patiala"] }
                            ]
                        }
                    }
                ]
            }
        ]
    };

    console.log("🚀 Sending GOLDEN LEAD to Himanshu Team...");
    try {
        const response = await axios.post(url, payload);
        console.log("✅ Server Response:", response.data);
    } catch (error) {
        console.error("❌ Error:", error.response?.data || error.message);
    }
}

finalGoldenTest();
