require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('🚀 Starting Data Migration to Supabase...');

    // 1. Read JSON
    const jsonPath = path.join(__dirname, '../public/data/members.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ Members JSON not found at:', jsonPath);
        process.exit(1);
    }

    const members = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`📊 Found ${members.length} members in local JSON.`);

    // 2. Transform for DB (optional, but good to ensure cleanliness)
    // We assume table 'members' has columns: callsign, name, member_id, expiry, is_local
    const records = members.map(m => ({
        callsign: m.callsign,
        name: m.name,
        member_id: m.member_id || m.memberId,
        expiry: m.expiry,
        is_local: m.is_local || false
    }));

    // 3. Insert in batches of 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('members').upsert(batch, { onConflict: 'callsign' });

        if (error) {
            console.error(`❌ Error inserting batch ${i}:`, error.message);
        } else {
            console.log(`✅ Inserted/Updated members ${i + 1} to ${Math.min(i + BATCH_SIZE, records.length)}`);
        }
    }

    console.log('🏁 Migration Complete!');
}

seed();
