const fs = require('fs');

async function scrapeMartsData() {
    const totalPages = 73;
    const allData = [];

    console.log('🚀 Starting scraper...');

    for (let page = 1; page <= totalPages; page++) {
        try {
            console.log(`Fetching page ${page}/${totalPages}...`);
            const response = await fetch('https://ahli.marts.org.my/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `search=&ms=${page}`
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const html = await response.text();

            // Simple regex parsing since we don't have DOMParser in Node
            // Looking for rows: <tr><td>...</td><td>CALLSIGN</td><td>NAME</td><td>ID</td><td>EXPIRY</td></tr>
            const rowRegex = /<tr>\s*<td>.*?<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>/g;

            let match;
            while ((match = rowRegex.exec(html)) !== null) {
                const callsign = match[1].replace(/<[^>]*>/g, '').trim();
                const name = match[2].replace(/<[^>]*>/g, '').trim();
                const memberId = match[3].replace(/<[^>]*>/g, '').trim();
                const expiry = match[4].replace(/<[^>]*>/g, '').trim();

                if (callsign && name && memberId && callsign !== 'CALLSIGN' && callsign !== 'Callsign') {
                    allData.push({
                        id: 'M' + String(allData.length + 1).padStart(5, '0'),
                        callsign,
                        name,
                        member_id: memberId,
                        expiry,
                        is_local: false
                    });
                }
            }

        } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
        }

        // Politeness delay
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Scraped ${allData.length} members`);

    fs.writeFileSync('data/members.json', JSON.stringify(allData, null, 4));
    console.log('💾 Saved to data/members.json');
}

scrapeMartsData();
