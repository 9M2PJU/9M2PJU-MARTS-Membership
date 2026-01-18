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

function calculateStatus(expiryStr) {
    if (!expiryStr || expiryStr === '-') return 'expired';

    try {
        const parts = expiryStr.split('/');
        const year = parseInt(parts[0]);
        // If only year is present (e.g. "2024"), assume end of that year? 
        // Or if logic dictates, maybe it's valid until end of 2024.
        // Original logic: "2019/03" -> End of March 2019.

        let month = 11; // Default to Dec (Index 11)
        if (parts[1]) {
            month = parseInt(parts[1]) - 1;
        }

        const expiryDate = new Date(year, month + 1, 0, 23, 59, 59); // Last day of month
        const now = new Date();

        return now > expiryDate ? 'expired' : 'active';
    } catch (e) {
        return 'expired';
    }
}

async function seed() {
    console.log('🚀 Starting Enhanced Data Migration (v2)...');

    // 1. Read JSON
    const jsonPath = path.join(__dirname, '../public/data/members.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ Members JSON not found at:', jsonPath);
        process.exit(1);
    }

    const members = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`📊 Found ${members.length} members in local JSON.`);

    // 2. Transform for DB
    const records = members.map(m => ({
        callsign: m.callsign,
        name: m.name,
        member_id: m.member_id || m.memberId,
        expiry: m.expiry,
        is_local: m.is_local || false,

        // NEW FIELDS
        date_of_birth: null, // Not available in public data
        ic_number: null,     // Not available in public data
        status: calculateStatus(m.expiry)
    }));

    // 3. Insert in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        // We use upsert to update existing records with the new fields
        const { error } = await supabase.from('members').upsert(batch, { onConflict: 'callsign' });

        if (error) {
            console.error(`❌ Error inserting batch ${i}:`, error.message);
        } else {
            console.log(`✅ Upserted members ${i + 1} to ${Math.min(i + BATCH_SIZE, records.length)}`);
        }
    }

    console.log('🏁 Migration Complete!');
}

seed();
