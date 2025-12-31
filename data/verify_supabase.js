
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkSupabase() {
    console.log('--- Checking Supabase Configuration ---');

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    console.log(`URL Found: ${!!url} ${url ? '(Length: ' + url.length + ')' : ''}`);
    console.log(`Key Found: ${!!key} ${key ? '(Length: ' + key.length + ')' : ''}`);

    if (!url || !key) {
        console.error('❌ Missing Supabase URL or Key in .env.local');
        // Check what is present
        const envKeys = Object.keys(process.env).filter(k => k.includes('SUPABASE'));
        console.log('Env keys containing SUPABASE:', envKeys);
        return;
    }

    try {
        const supabase = createClient(url, key);
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('❌ Supabase Connection Failed:', error.message);
        } else {
            console.log('✅ Supabase Connection Successful!');
            console.log('Session Check:', data.session ? 'Active Session' : 'No Active Session (Expected)');

            // Check Project Config (if possible via simple fetch to verify CORS/URL)
            // We can't easily check SMTP settings from client lib
        }
    } catch (e) {
        console.error('❌ Exception during connection check:', e.message);
    }
}

checkSupabase();
