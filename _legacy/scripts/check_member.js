async function checkMember(callsign) {
    console.log(`🔎 Searching for ${callsign} on MARTS...`);

    try {
        const response = await fetch('https://ahli.marts.org.my/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: `search=${callsign}`
        });

        const html = await response.text();

        // Check if we found results
        if (html.includes(callsign)) {
            console.log('✅ Member FOUND in search results!');
            console.log('--- HTML Snippet ---');
            // Extract the table row
            const regex = new RegExp(`<tr>.*?${callsign}.*?</tr>`, 's');
            const match = html.match(regex);
            if (match) {
                console.log(match[0]);
            } else {
                console.log('Could not extract row, but callsign string is present.');
            }
        } else {
            console.log('❌ Member NOT FOUND in search results.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

checkMember('9M2PJU');
