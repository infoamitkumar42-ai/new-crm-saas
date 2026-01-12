// config/env.ts

// Handle cases where import.meta.env might be undefined (Safety check)
// @ts-ignore
const safeEnv: any = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

export const ENV = {
  // --- Supabase Config (Public) ---
  SUPABASE_URL: safeEnv.VITE_SUPABASE_URL || "https://vewqzsqddgmkslnuctvb.supabase.co",
  SUPABASE_ANON_KEY: safeEnv.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4",

  // --- Google Script (Public) ---
  APPS_SCRIPT_URL: safeEnv.VITE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzq4iBT3_Cdcj2OO8XY8B5IXNSIHa0AJdYYTGCx1lGJFPbVt1RmDvF5gel0JD-12TDI/exec",

  // --- Razorpay Public Key (Frontend ke liye safe hai) ---
  RAZORPAY_KEY_ID: safeEnv.VITE_RAZORPAY_KEY_ID || "rzp_live_RnAEaa2JKAP8Ow",

  // ⚠️ NOTE: Maine Secret Keys yahan se hata di hain.
  // Unhe Frontend mein kabhi mat daalna. Backend apne aap utha lega.
};
