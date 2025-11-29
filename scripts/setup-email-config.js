
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    red: "\x1b[31m"
};

async function main() {
    console.log(`\n${colors.bright}${colors.cyan}📧 MI Practice Coach - Email Configuration Setup${colors.reset}\n`);
    console.log("This script will help you configure email settings in your .env.local file.");
    console.log("You can choose between Resend (recommended), Custom SMTP, or just skipping (Log Mode).\n");

    console.log("1. Resend API (Recommended - easiest setup, free tier)");
    console.log("2. Custom SMTP (Gmail, SendGrid, etc.)");
    console.log("3. Development Log Mode (Emails are printed to console, not sent)");
    
    const choice = await question(`\n${colors.yellow}Select an option (1-3): ${colors.reset}`);

    let newEnvVars = {};

    if (choice === '1') {
        console.log(`\n${colors.bright}--- Resend Configuration ---${colors.reset}`);
        console.log("Get your API Key at https://resend.com/api-keys");
        
        const apiKey = await question("Enter Resend API Key (re_...): ");
        if (!apiKey.startsWith('re_')) {
            console.warn(`${colors.yellow}Warning: Resend keys usually start with 're_'${colors.reset}`);
        }
        
        const fromEmail = await question("Enter From Email (e.g., 'App <onboarding@resend.dev>' or verified domain): ");
        
        newEnvVars = {
            RESEND_API_KEY: apiKey,
            EMAIL_FROM: fromEmail,
            EMAIL_SKIP_SEND: 'false'
        };

    } else if (choice === '2') {
        console.log(`\n${colors.bright}--- SMTP Configuration ---${colors.reset}`);
        
        const host = await question("SMTP Host (e.g., smtp.gmail.com): ");
        const port = await question("SMTP Port (default 587): ") || "587";
        const user = await question("SMTP User (email): ");
        const pass = await question("SMTP Password (app password, not login password): ");
        const fromEmail = await question(`From Email (default ${user}): `) || user;
        const secure = await question("Use Secure Connection (true/false, default false): ") || "false";

        newEnvVars = {
            SMTP_HOST: host,
            SMTP_PORT: port,
            SMTP_USER: user,
            SMTP_PASS: pass,
            SMTP_SECURE: secure,
            EMAIL_FROM: fromEmail,
            EMAIL_SKIP_SEND: 'false'
        };

    } else {
        console.log(`\n${colors.bright}--- Development Log Mode ---${colors.reset}`);
        console.log("Emails will be logged to the server console instead of being sent.");
        
        newEnvVars = {
            EMAIL_SKIP_SEND: 'true'
        };
    }

    // Read existing .env.local
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or append variables
    let updatedContent = envContent;
    
    // Helper to update a key
    const updateKey = (key, value) => {
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(updatedContent)) {
            updatedContent = updatedContent.replace(regex, `${key}=${value}`);
        } else {
            // Ensure newline before appending if needed
            if (updatedContent && !updatedContent.endsWith('\n')) updatedContent += '\n';
            updatedContent += `${key}=${value}\n`;
        }
    };

    Object.entries(newEnvVars).forEach(([key, value]) => {
        updateKey(key, value);
    });

    // Also ask about Frontend URL
    const frontendUrl = await question(`\nFrontend URL (default http://localhost:3000): `);
    if (frontendUrl) {
        updateKey('FRONTEND_URL', frontendUrl);
    } else if (!updatedContent.includes('FRONTEND_URL=')) {
        updateKey('FRONTEND_URL', 'http://localhost:3000');
    }

    // Write back to file
    fs.writeFileSync(envPath, updatedContent);
    
    console.log(`\n${colors.green}✅ .env.local has been updated!${colors.reset}`);
    
    if (choice !== '3') {
        console.log(`\n${colors.yellow}Important:${colors.reset} For SIGNUP emails (sent by Supabase Auth),`);
        console.log("you MUST also configure these settings in the Supabase Dashboard:");
        console.log("Project Settings -> Auth -> SMTP Settings");
        
        if (choice === '1') {
            console.log("\nFor Resend with Supabase SMTP:");
            console.log("- Host: smtp.resend.com");
            console.log("- Port: 465");
            console.log("- User: resend");
            console.log("- Password: [Your Resend API Key]");
        } else if (choice === '2') {
            console.log("\nUse the same SMTP credentials you just entered.");
        }
    }

    console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
    console.log("1. Restart your backend server: npm run dev:server");
    console.log("2. If you chose option 3, you can confirm users manually using:");
    console.log("   node scripts/confirm-user.js <email>");
    
    rl.close();
}

main().catch(console.error);

