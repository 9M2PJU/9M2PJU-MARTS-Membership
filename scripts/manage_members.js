const fs = require('fs');
const path = require('path');

const MEMBERS_FILE = path.join(__dirname, '../data/members.json');

// Helper to parse issue body
function parseIssueBody(body) {
    const lines = body.split('\n');
    const data = {};
    let currentKey = null;

    for (const line of lines) {
        if (line.startsWith('### ')) {
            currentKey = line.replace('### ', '').trim().toLowerCase().replace(/ /g, '_');
        } else if (currentKey && line.trim() && !line.startsWith('_')) {
            data[currentKey] = line.trim();
        }
    }
    return data;
}

async function main() {
    const action = process.env.ACTION_TYPE; // 'add' or 'delete'
    const issueBody = process.env.ISSUE_BODY;

    if (!issueBody) {
        console.error('No issue body provided');
        process.exit(1);
    }

    const inputData = parseIssueBody(issueBody);
    console.log('Parsed Input:', inputData);

    let members = [];
    try {
        members = JSON.parse(fs.readFileSync(MEMBERS_FILE, 'utf8'));
    } catch (e) {
        console.error('Error reading members file:', e);
        process.exit(1);
    }

    if (action === 'add') {
        const newMember = {
            id: 'M' + String(members.length + 1).padStart(5, '0'),
            callsign: inputData.callsign.toUpperCase(),
            name: inputData.name.toUpperCase(),
            member_id: inputData.member_id || inputData.membership_id,
            expiry: inputData.expiry_date || inputData.expiry,
            is_local: false
        };

        if (members.find(m => m.callsign === newMember.callsign)) {
            console.log(`Member ${newMember.callsign} already exists. Updating...`);
            const index = members.findIndex(m => m.callsign === newMember.callsign);
            members[index] = { ...members[index], ...newMember, id: members[index].id };
        } else {
            console.log(`Adding member ${newMember.callsign}...`);
            members.push(newMember);
        }

    } else if (action === 'delete') {
        const targetCallsign = (inputData.callsign_to_delete || inputData.callsign).toUpperCase();
        const initialLength = members.length;
        members = members.filter(m => m.callsign !== targetCallsign);

        if (members.length === initialLength) {
            console.log(`Member ${targetCallsign} not found.`);
        } else {
            console.log(`Deleted member ${targetCallsign}.`);
        }
    }

    fs.writeFileSync(MEMBERS_FILE, JSON.stringify(members, null, 4));
    console.log('✅ members.json updated');
}

main();
