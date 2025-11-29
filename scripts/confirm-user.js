
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    bright: "\x1b[1m"
};

async function confirmUser() {
    const email = process.argv[2];

    if (!email) {
        console.error(`${colors.red}Error: Please provide an email address.${colors.reset}`);
        console.log(`Usage: node scripts/confirm-user.js user@example.com`);
        process.exit(1);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error(`${colors.red}Error: Missing Supabase credentials.${colors.reset}`);
        console.error("Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env.local");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log(`${colors.bright}Attempting to confirm user: ${email}...${colors.reset}`);

    try {
        // Admin allow to update user attributes without email verification
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) throw listError;

        const user = users.find(u => u.email === email);

        if (!user) {
            console.error(`${colors.red}User not found!${colors.reset}`);
            console.log("Make sure the user has signed up first.");
            process.exit(1);
        }

        if (user.email_confirmed_at) {
            console.log(`${colors.yellow}User is already confirmed!${colors.reset}`);
            process.exit(0);
        }

        const { data, error } = await supabase.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
        );

        if (error) throw error;

        console.log(`${colors.green}✅ User ${email} confirmed successfully!${colors.reset}`);
        console.log("They can now log in without email verification.");

    } catch (error) {
        console.error(`${colors.red}Failed to confirm user:${colors.reset}`, error.message);
        process.exit(1);
    }
}

confirmUser();

