
const fs = require('fs');

async function deploy() {
    console.log("🛠️ FIXING LEAD VISIBILITY & ROLE ISSUES...");
    console.log("   I suspect the Leads were hidden because of a 'user_id' vs 'assigned_to' mismatch.");
    console.log("   I have created 'FIX_LEAD_VISIBILITY.sql' to allow BOTH.");

    console.log("\n👇 ACTION REQUIRED:");
    console.log("   1. Run 'FIX_LEAD_VISIBILITY.sql' in Supabase SQL Editor.");
    console.log("   2. LOG OUT and LOG IN again to refresh your Profile/Role.");

    console.log("\n❓ IF YOU STILL SEE 'MEMBER':");
    console.log("   Please tell me which EMAIL you are using.");
    console.log("   I found 'Amit (Admin)' (info.amitkumar42@gmail.com) is the REAL Admin.");
    console.log("   'AMIT' (amitdemo1@gmail.com) is just a Member.");
}

deploy();
