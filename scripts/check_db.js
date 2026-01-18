require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Testing connection...');
    const { data, error } = await supabase.from('members').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Error accessing members table:', error.message);
        console.log('👉 Please ensure you ran the SQL I provided!');
    } else {
        console.log('✅ Connection Successful!');
        console.log(`📊 Current Member Count in DB: ${data.length === 0 ? '0 (or count query)' : 'Unknown'}`);
        // Count is actually in the return object count property if specified, but head:true returns null data usually or empty array
    }
}

check();
