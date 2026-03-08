async function testWebhooks() {
    console.log("--- GET REQUEST ---");
    try {
        const res1 = await fetch("https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/meta-webhook", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const text1 = await res1.text();
        console.log("Status:", res1.status);
        console.log("Body:", text1);
    } catch (e) {
        console.log("Error:", e.message);
    }

    console.log("\n--- POST REQUEST ---");
    try {
        const body = { "object": "page", "entry": [{ "id": "test123", "time": 1234567890, "changes": [{ "field": "leadgen", "value": { "form_id": "test", "leadgen_id": "test", "page_id": "test123", "created_time": 1234567890 } }] }] };
        const res2 = await fetch("https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/meta-webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const text2 = await res2.text();
        console.log("Status:", res2.status);
        console.log("Body:", text2);
    } catch (e) {
        console.log("Error:", e.message);
    }
}

testWebhooks();
