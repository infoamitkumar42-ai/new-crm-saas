const { createClient } = require('@supabase/supabase-js');
const ENV = require('./config/env').ENV;

const SUPABASE_URL = ENV.SUPABASE_URL || 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_ANON_KEY = ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAnon() {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    console.log("Anon query data:", data);
    console.log("Anon query error:", error);
}

checkAnon();
