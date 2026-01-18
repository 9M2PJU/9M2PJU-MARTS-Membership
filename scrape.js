const fs = require('fs');

async function scrapeMartsData() {
    const allData = [];

    // Auto-detect end of pagination
    // We expect around 73 pages, but we'll let it grow naturally.
    let page = 1;
    let hasMore = true;
    let consecutiveEmptyPages = 0;

    console.log(`🚀 Starting SMART scraper (Auto-Detect Pages)...`);

    while (hasMore) {
        try {
            console.log(`Fetching page ${page}...`);

            // Small random delay 500ms-1500ms
            const delay = Math.floor(Math.random() * 1000) + 500;
            if (page > 1) {
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

            console.log(`✅ Page ${page}: Found ${pageCount} members. Total: ${allData.length}`);

            if (pageCount === 0) {
                consecutiveEmptyPages++;
            } else {
                consecutiveEmptyPages = 0;
            }

            // Stop if we hit 5 empty pages in a row (end of list)
            if (consecutiveEmptyPages >= 5) {
                console.log('🛑 No data for 5 consecutive pages. Stopping.');
                hasMore = false;
            }

            // Safety limit (e.g., 200 pages) just in case
            if (page > 200) {
                console.log('🛑 Reached safety limit of 200 pages. Stopping.');
                hasMore = false;
            }

            page++;

        } catch (error) {
            console.error(`❌ Error fetching page ${page}:`, error);
            // Wait a bit longer on error
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Final Save
    console.log(`🏁 Scrape Complete! Total Members: ${allData.length}`);
    fs.writeFileSync('data/members.json', JSON.stringify(allData, null, 4));
    console.log('💾 Saved to data/members.json');
}

scrapeMartsData();
