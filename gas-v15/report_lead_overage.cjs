const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function generateLeadReport() {
    console.log("Generatng Lead Overage Report...");
    let output = "NAME | PLAN | ACTUAL | PROMISED | STATUS\n";
    output += "-------------------------------------------------------------\n";

    // 1. Fetch all active users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, phone, plan_name, total_leads_promised, total_limit, is_active')
        .eq('is_active', true)
        .eq('payment_status', 'active');

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    // 2. Process each user
    const reportData = [];

    for (const user of users) {
        // Count actual leads assigned
        const { count, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id);

        if (countError) {
            console.error(`Error counting leads for ${user.name}:`, countError);
            continue;
        }

        // Determine the "Promised" or "Limit" value to compare against
        const promised = user.total_limit || user.total_leads_promised || 0;
        const extra = count - promised;

        reportData.push({
            name: user.name,
            phone: user.phone || "N/A",
            plan: user.plan_name,
            actual: count,
            promised: promised,
            extra: extra
        });
    }

    // 3. Sort by "Extra" leads (Descending) - showing who got the most extra first
    reportData.sort((a, b) => b.extra - a.extra);

    // 4. Format Output
    reportData.forEach(r => {
        let status = "";
        if (r.extra > 0) {
            status = `🔴 +${r.extra} EXTRA`;
        } else if (r.extra < 0) {
            status = `🟢 ${Math.abs(r.extra)} PENDING`;
        } else {
            status = "✅ EXACT";
        }

        const name = r.name.padEnd(20).substring(0, 20);
        const plan = (r.plan || "No Plan").padEnd(15).substring(0, 15);
        const actual = String(r.actual).padEnd(8);
        const promised = String(r.promised).padEnd(10);
        const phone = String(r.phone).padEnd(12);

        output += `${name} | ${phone} | ${plan} | ${actual} | ${promised} | ${status}\n`;
    });

    output += "\n-------------------------------------------------------------\n";
    output += `Total Active Users Checked: ${users.length}\n`;

    fs.writeFileSync('lead_report_jan22.txt', output);
    console.log("Report saved to lead_report_jan22.txt");
}

generateLeadReport();
