// Simple, Vite-friendly Env Configuration
export const ENV = {
  // 🛡️ Global Cloudflare Proxy URL: Directly targeting the Cloudflare proxy domain
  // (Bypasses ISP blocks for REST and WebSockets)
  SUPABASE_URL: "https://api.leadflowcrm.in" || import.meta.env.VITE_SUPABASE_URL,

  // 🔌 Direct URL for WebSockets (Using Cloudflare Proxy)
  SUPABASE_DIRECT_URL: "https://api.leadflowcrm.in" || import.meta.env.VITE_SUPABASE_URL,

  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4",
  APPS_SCRIPT_URL: import.meta.env.VITE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzq4iBT3_Cdcj2OO8XY8B5IXNSIHa0AJdYYTGCx1lGJFPbVt1RmDvF5gel0JD-12TDI/exec",
  // Note: Using RAZORPAY_KEY_ID as per codebase convention
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_RnAEaa2JKAP8Ow",
};

console.log("🚀 Env Loaded:", {
  url: ENV.SUPABASE_URL,
  key_exists: !!ENV.SUPABASE_ANON_KEY
});
