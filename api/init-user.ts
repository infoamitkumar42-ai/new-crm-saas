import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// ✅ Bas ye line likho, URL mat chipkao. Vercel khud value daal dega.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("CRITICAL: Missing Supabase Config in API");
}

// ✅ Is line ko bhi aise hi rehne do. '!' ka matlab hai "Trust me, value hai".
const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ... Baaki code same rahega ...
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, sheetUrl, id } = req.body;

    if (!email || !id) {
      return res.status(400).json({ error: "Email and ID required" });
    }

    console.log("Saving profile for:", email);

    // Database mein user save karo
    const { error } = await supabaseAdmin.from("users").upsert(
      {
        id: id,
        email,
        name,
        sheet_url: sheetUrl,
        payment_status: "inactive",
        daily_limit: 10,
        role: "user",
        filters: {} 
      },
      { onConflict: "email" }
    );

    if (error) {
        console.error("Supabase Write Error:", error);
        throw error;
    }

    return res.status(200).json({ success: true });

  } catch (err: any) {
    console.error("Init User API Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
