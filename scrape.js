const fs = require('fs');

async function scrapeMartsData() {
    const allData = [];

    console.log('🚀 Starting SAFE scraper (User-Agent + Random Delays)...');

    let page = 1;
    let hasMore = true;
    let consecEmptyPages = 0;

    while (hasMore) {
        try {
            console.log(`Fetching page ${page}...`);

            // Random delay 2-5 seconds to simulate user reading
            const delay = Math.floor(Math.random() * 3000) + 2000;
            if (page > 1) {
                console.log(`Waiting ${delay}ms...`);
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

            // Simple regex parsing since we don't have DOMParser in Node
            // Looking for rows: <tr><td>...</td><td>CALLSIGN</td><td>NAME</td><td>ID</td><td>EXPIRY</td></tr>
            const rowRegex = /<tr>\s*<td>.*?<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>/g;

            let match;
            let pageCount = 0;
            while ((match = rowRegex.exec(html)) !== null) {
                const callsign = match[1].replace(/<[^>]*>/g, '').trim();
                const name = match[2].replace(/<[^>]*>/g, '').trim();
                const memberId = match[3].replace(/<[^>]*>/g, '').trim();
                const expiry = match[4].replace(/<[^>]*>/g, '').trim();

                if (callsign && name && memberId && callsign !== 'CALLSIGN' && callsign !== 'Callsign') {
                    // Check if already exists (handle potential duplicates across pages if any)
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

            // The list has gaps, so we need to be more persistent. 
            // Try up to 50 empty pages before giving up? 
            // Or just hard limit at a reasonable number like 1000 for safely grabbing everything?
            // Let's use a dynamic safe limit.

            if (consecEmptyPages >= 20) {
                console.log('🛑 No more data found for 20 consecutive pages. Stopping.');
                hasMore = false;
            }

            // Hard limit to prevent infinite loops if logic fails
            if (page > 300) {
                console.log('🛑 Reached page 300 limit. Stopping for safety.');
                hasMore = false;
            }

            page++;

        } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
            // Retry once? Or just skip
        }
    }

    console.log(`✅ Scraped ${allData.length} members`);

    fs.writeFileSync('data/members.json', JSON.stringify(allData, null, 4));
    console.log('💾 Saved to data/members.json');
}

scrapeMartsData();
