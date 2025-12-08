export const ENV = {
  // Direct access is required for Vite to replace these at build time
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || "https://vewqzsqddgmkslnuctvb.supabase.co",
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4",
  
  APPS_SCRIPT_URL: import.meta.env.VITE_APPS_SCRIPT_URL || "",
  
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_RnAEaa2JKAP8Ow",
  
  // Secrets
  RAZORPAY_KEY_SECRET: import.meta.env.VITE_RAZORPAY_KEY_SECRET || "",
  RAZORPAY_WEBHOOK_URL: import.meta.env.VITE_RAZORPAY_WEBHOOK_URL || "",
  RAZORPAY_WEBHOOK_SECRET: import.meta.env.VITE_RAZORPAY_WEBHOOK_SECRET || ""
};
