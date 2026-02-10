
// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  readonly VITE_RAZORPAY_KEY_ID: string;
  readonly VITE_RAZORPAY_WEBHOOK_SECRET: string;
  readonly VITE_APPS_SCRIPT_URL: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}