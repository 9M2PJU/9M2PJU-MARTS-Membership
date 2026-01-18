const fs = require('fs');

async function scrapeMartsData() {
    const allData = [];

    console.log('🚀 Starting SAFE scraper (User-Agent + Random Delays)...');

    let page = 1;
    let hasMore = true;
    let consecEmptyPages = 0;

    // Load existing data if possible so we don't start from scratch if restarting
    if (fs.existsSync('data/members.json')) {
        try {
            const existing = JSON.parse(fs.readFileSync('data/members.json'));
            if (Array.isArray(existing) && existing.length > 0) {
                // Actually, better to start fresh to ensure clean state, 
                // or maybe append? Let's start fresh to avoid duplicates/stale data
                // but keep file backup logic if needed.
                // For now, let's just Overwrite to be sure we get a Source of Truth.
            }
        } catch (e) {
            console.log('Starting fresh...');
        }
    }

    while (hasMore) {
        try {
            console.log(`Fetching page ${page}...`);

            // Random delay 2-5 seconds to simulate user reading
            const delay = Math.floor(Math.random() * 3000) + 2000;
            if (page > 1) {
                // console.log(`Waiting ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            const response = await fetch('https://ahli.marts.org.my/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://ahli.marts.org.my/',
                    'Origin': 'https://ahli.marts.org.my'
                },
                body: `search=&ms=${page}`
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const html = await response.text();

            // Row Parsing
            const rowRegex = /<tr>\s*<td>.*?<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>/g;

            let match;
            let pageCount = 0;
            while ((match = rowRegex.exec(html)) !== null) {
                const callsign = match[1].replace(/<[^>]*>/g, '').trim();
                const name = match[2].replace(/<[^>]*>/g, '').trim();
                const memberId = match[3].replace(/<[^>]*>/g, '').trim();
                const expiry = match[4].replace(/<[^>]*>/g, '').trim();

                if (callsign && name && memberId && callsign !== 'CALLSIGN' && callsign !== 'Callsign') {
                    if (!allData.find(m => m.callsign === callsign)) {
                        allData.push({
                            id: 'M' + String(allData.length + 1).padStart(5, '0'),
                            callsign,
                            name,
                            member_id: memberId,
                            expiry,
                            is_local: false
                        });
                        pageCount++;
                    }
                }
            }

            if (pageCount === 0) {
                consecEmptyPages++;
                console.log(`⚠️ No members found on page ${page}`);
            } else {
                consecEmptyPages = 0;
                console.log(`✅ Found ${pageCount} members on page ${page} (Total: ${allData.length})`);
            }

            // Stop conditions
            if (consecEmptyPages >= 20) {
                console.log('🛑 No more data found for 20 consecutive pages. Stopping.');
                hasMore = false;
            }

            // Safe limit
            if (page > 1000) {
                console.log('🛑 Reached page 1000 limit. Stopping.');
                hasMore = false;
            }

            page++;

            // Save every 10 pages so we don't lose everything if crashed
            if (page % 10 === 0 && allData.length > 0) {
                fs.writeFileSync('data/members.json', JSON.stringify(allData, null, 4));
                console.log('💾 Intermediary save...');
            }

        } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait longer on error
        }
    }

    // Final Save
    console.log(`✅ Scraped ${allData.length} members`);
    fs.writeFileSync('data/members.json', JSON.stringify(allData, null, 4));
    console.log('💾 Final Save to data/members.json');
}

scrapeMartsData();
