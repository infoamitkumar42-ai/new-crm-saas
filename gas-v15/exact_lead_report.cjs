const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually load .env.local
try {
    const envPath = path.resolve(__dirname, '../.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error("Could not load .env.local:", e.message);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials. Loaded keys:", Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateExactReport() {
    const today = new Date().toISOString().split('T')[0]; // 2026-01-22

    console.log("=".repeat(80));
    console.log("                    EXACT LEAD REPORT - " + today);
    console.log("=".repeat(80));

    // 1. Get ALL active users with plan info
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, phone, plan_name, valid_until, total_limit, total_leads_promised, is_active, payment_status')
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .order('valid_until', { ascending: true });

    if (error) {
        console.error("Error:", error);
        return;
    }

    // Categorize users
    const stopToday = [];      // Expired or expiring today
    const activeUsers = [];    // Still have time

    for (const user of users) {
        // Count ACTUAL leads from leads table
        const { count, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id);

        if (countError) {
            console.error(`Error for ${user.name}:`, countError);
            continue;
        }

        const validUntil = user.valid_until ? user.valid_until.split('T')[0] : null;
        const promised = user.total_limit || user.total_leads_promised || 0;
        const actual = count || 0;
        const pending = promised - actual;

        const userData = {
            name: user.name,
            phone: user.phone || "N/A",
            plan: user.plan_name || "none",
            validUntil: validUntil,
            promised: promised,
            actual: actual,
            pending: pending
        };

        // Check if expired or expiring today
        if (!validUntil || validUntil <= today) {
            stopToday.push(userData);
        } else {
            activeUsers.push(userData);
        }
    }

    // Print STOP TODAY section
    console.log("\n🛑 STOP TODAY (Expired or Expiring Today - " + today + "):");
    console.log("-".repeat(80));
    console.log("NAME".padEnd(22) + "PHONE".padEnd(14) + "PLAN".padEnd(16) + "VALID UNTIL".padEnd(14) + "ACTUAL".padEnd(10) + "LIMIT".padEnd(10) + "PENDING");
    console.log("-".repeat(80));

    if (stopToday.length === 0) {
        console.log("None");
    } else {
        stopToday.forEach(u => {
            console.log(
                u.name.padEnd(22).substring(0, 22) +
                String(u.phone).padEnd(14).substring(0, 14) +
                u.plan.padEnd(16).substring(0, 16) +
                (u.validUntil || "N/A").padEnd(14) +
                String(u.actual).padEnd(10) +
                String(u.promised).padEnd(10) +
                (u.pending > 0 ? u.pending + " LEFT" : "COMPLETE")
            );
        });
    }

    // Print ACTIVE users
    console.log("\n\n✅ ACTIVE USERS (Plan valid beyond today):");
    console.log("-".repeat(80));
    console.log("NAME".padEnd(22) + "PHONE".padEnd(14) + "PLAN".padEnd(16) + "VALID UNTIL".padEnd(14) + "ACTUAL".padEnd(10) + "LIMIT".padEnd(10) + "PENDING");
    console.log("-".repeat(80));

    activeUsers.forEach(u => {
        console.log(
            u.name.padEnd(22).substring(0, 22) +
            String(u.phone).padEnd(14).substring(0, 14) +
            u.plan.padEnd(16).substring(0, 16) +
            (u.validUntil || "N/A").padEnd(14) +
            String(u.actual).padEnd(10) +
            String(u.promised).padEnd(10) +
            (u.pending > 0 ? u.pending + " LEFT" : "COMPLETE")
        );
    });

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY:");
    console.log(`  - Total Active Users: ${users.length}`);
    console.log(`  - Users to STOP today: ${stopToday.length}`);
    console.log(`  - Users still active: ${activeUsers.length}`);
    console.log("=".repeat(80));
}

generateExactReport();
