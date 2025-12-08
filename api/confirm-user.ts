
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient, User } from '@supabase/supabase-js';

// Secure server-side configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://vewqzsqddgmkslnuctvb.supabase.co";
// In a real Vercel deployment, this must be in Environment Variables. Hardcoded here for the demo context.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, id } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    // If ID is provided (best practice), confirm by ID
    if (id) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        email_confirm: true
      });
      
      if (error) throw error;
      return res.status(200).json({ success: true, method: 'id' });
    } 
    
    // Fallback: Confirm by email (requires iterating or specific config, less reliable via API but implemented for robustness)
    // Note: Standard Supabase Admin API prefers ID. 
    // For this specific request, we assume the frontend sends the ID.
    // If we only have email, we'd have to list users to find the ID.
    const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    
    // Explicitly type users to avoid TS inference issues (e.g., 'never')
    const users: User[] = data?.users || [];
    
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email_confirm: true
    });

    if (updateError) throw updateError;

    return res.status(200).json({ success: true, method: 'email_lookup' });

  } catch (err: any) {
    console.error("Confirm User Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
