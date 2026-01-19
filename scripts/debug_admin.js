require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// We need the service role key to bypass RLS for the "check" part, 
// but we don't have it in env.local usually. 
// We will try with anon key first to see if it works (simulating frontend).

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmin() {
    const email = '9m2pju@hamradio.my';
    console.log(`Checking admin status for: ${email}`);

    // 1. Try to fetch with Anon Key (simulating frontend)
    const { data, error } = await supabase
        .from('app_admins')
        .select('*')
        .eq('email', email);

    if (error) {
        console.error('❌ Frontend Query Failed (Likely RLS):', error.message);
    } else if (data.length === 0) {
        console.log('❌ User not found in app_admins table (or hidden by RLS).');
    } else {
        console.log('✅ User found with Anon Key:', data[0]);
    }
}

checkAdmin();
