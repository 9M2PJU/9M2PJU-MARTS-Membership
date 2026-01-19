require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
    const email = '9m2pju@hamradio.my';
    const password = process.env.INITIAL_USER_PASSWORD;

    if (!password) {
        console.error('❌ Error: INITIAL_USER_PASSWORD environment variable is not set.');
        process.exit(1);
    }

    console.log(`🚀 Attempting to register ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('already registered')) {
            console.log('💡 GUIDANCE: This user already exists.');
            console.log('   You must delete the user in Supabase Dashboard -> Authentication -> Users');
            console.log('   Then run this script again OR create the user manually in the dashboard with the password.');
        }
    } else {
        console.log('✅ User created successfully!');
        console.log('   Please check your email to confirm specific to your Supabase settings, or assume it works if Auto Confirm is on.');
    }
}

createUser();
