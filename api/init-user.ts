
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, sheetUrl, id } = req.body;

    if (!email) return res.status(400).json({ error: "Email required" });

    // Use Upsert to ensure idempotency and correct sheet_url storage
    const { error } = await supabaseAdmin.from("users").upsert(
      {
        id: id, // Optional if ID isn't provided (but it usually is from frontend), Supabase handles UUID
        email,
        name,
        sheet_url: sheetUrl,
        payment_status: "inactive",
        filters: {
           age_min: 18,
           age_max: 60,
           cities: [],
           genders: ['All'],
           professions: [],
           min_income: 0
        },
        daily_limit: 10,
        role: "user",
      },
      { onConflict: "email" }
    );

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Init User Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
