// Handle cases where import.meta.env might be undefined
// @ts-ignore
const safeEnv: any = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

export const ENV = {
  SUPABASE_URL: safeEnv.VITE_SUPABASE_URL || "https://vewqzsqddgmkslnuctvb.supabase.co",
  SUPABASE_ANON_KEY: safeEnv.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4",
  APPS_SCRIPT_URL: safeEnv.VITE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzsK8txrkWs834x9AtSxFjsXb__iJbCKj4GC9M4CdZtkQjEPssXsZkLkYTxQuWLFzml/exec",
  RAZORPAY_KEY_ID: safeEnv.VITE_RAZORPAY_KEY_ID || "rzp_live_RnAEaa2JKAP8Ow",
  RAZORPAY_KEY_SECRET: safeEnv.VITE_RAZORPAY_KEY_SECRET || "gk0sC1rcrf1bc0e48VGRSJq4",
  RAZORPAY_WEBHOOK_URL: safeEnv.VITE_RAZORPAY_WEBHOOK_URL || "https://leadflow.com/api/razorpay-webhook",
  RAZORPAY_WEBHOOK_SECRET: safeEnv.VITE_RAZORPAY_WEBHOOK_SECRET || "mySuperSecretWebhookKey_123"
};
