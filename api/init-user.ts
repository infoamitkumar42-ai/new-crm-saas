import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Vercel Env Vars se keys lo
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("CRITICAL: Missing Supabase Config");
}

const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, name, sheetUrl, id } = req.body;

    // Database mein user save karo
    const { error } = await supabaseAdmin.from("users").upsert({
        id: id,
        email,
        name,
        sheet_url: sheetUrl, // Agar sheetUrl null hai, tab bhi save karega
        payment_status: "inactive",
        daily_limit: 10,
        role: "user",
        filters: {} 
    }, { onConflict: "email" });

    if (error) {
        console.error("Supabase Write Error:", error);
        throw error;
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
