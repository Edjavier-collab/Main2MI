
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkSupabaseNetwork() {
    console.log('--- Checking Supabase Network ---');

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) return;

    const supabase = createClient(url, key);

    console.log('Attempting sign-in with fake credentials to test API Key...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword'
    });

    if (error) {
        console.log('Response Error Status:', error.status);
        console.log('Response Error Message:', error.message);

        if (error.message.includes('Invalid API Key') || error.status === 401 || error.message.includes('JWSError')) {
            console.error('❌ API KEY IS INVALID. It appears to be incorrect or expired.');
        } else if (error.message.includes('Invalid login credentials')) {
            console.log('✅ API Key is Valid! (Got expected "Invalid login credentials" error)');
        } else {
            console.log('⚠️  Unexpected error, but connection likely made.');
        }
    } else {
        console.log('✅ Connection successful (Unexpected success on fake login?)');
    }
}

checkSupabaseNetwork();
