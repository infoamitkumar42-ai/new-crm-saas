import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Note: Using environment variables for connection
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function exportData() {
    console.log("🔍 Fetching January 2026 data for specific agents...");

    const agents = [
        'workwithrajwinder@gmail.com',
        'gurnambal01@gmail.com',
        'sunnymehre451@gmail.com',
        'rajnikaler01@gmail.com'
    ];

    // Using 'users' instead of 'profiles' as per database schema
    // Using 'source' instead of 'platform' as per database schema
    const { data, error } = await supabase
        .from('leads')
        .select(`
      created_at,
      name,
      phone,
      source,
      city,
      status,
      users!assigned_to!inner (name, email)
    `)
        .in('users.email', agents)
        .gte('created_at', '2026-01-01T00:00:00')
        .lte('created_at', '2026-01-31T23:59:59')
        .order('created_at', { ascending: true });

    if (error) {
        console.error("❌ Error fetching data:", error);
        return;
    }

    console.log(`✅ Found ${data.length} leads.`);

    if (data.length === 0) {
        console.log("ℹ️ No leads found for the specified criteria.");
        return;
    }

    // Convert to CSV
    const headers = "Date,Agent Name,Agent Email,Lead Name,Phone,Source,City,Status\n";
    const rows = data.map(lead => {
        const date = new Date(lead.created_at).toLocaleString();
        const agent = lead.users as any;
        const agentName = agent?.name || 'N/A';
        const agentEmail = agent?.email || 'N/A';

        // Escape quotes for CSV safety
        const escape = (val: any) => `"${(val || '').toString().replace(/"/g, '""')}"`;

        return `${escape(date)},${escape(agentName)},${escape(agentEmail)},${escape(lead.name)},${escape(lead.phone)},${escape(lead.source)},${escape(lead.city)},${escape(lead.status)}`;
    }).join("\n");

    fs.writeFileSync('January_2026_Report.csv', headers + rows);
    console.log("🎉 CSV Saved: January_2026_Report.csv");
}

exportData();
