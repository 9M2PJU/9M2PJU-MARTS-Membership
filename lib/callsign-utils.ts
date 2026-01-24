

export type Region = 'West Malaysia' | 'Sabah' | 'Sarawak' | 'Foreign' | 'Unknown';
export type LicenseClass = 'A' | 'B' | 'C' | 'SWL' | 'Unknown';

export function getRegion(callsign: string): Region {
    const upper = callsign.toUpperCase();
    if (upper.startsWith('SWL')) return 'West Malaysia';
    if (upper.startsWith('9M2') || upper.startsWith('9W2') || upper.startsWith('9W3') || upper.startsWith('9M4')) return 'West Malaysia';
    if (upper.startsWith('9M6') || upper.startsWith('9W6')) return 'Sabah';
    if (upper.startsWith('9M8') || upper.startsWith('9W8')) return 'Sarawak';

    if (upper.startsWith('9M') || upper.startsWith('9W')) return 'West Malaysia'; // Fallback for other Malaysian prefixes like 9M0?

    return 'Foreign';
}

export function getLicenseClass(callsign: string): LicenseClass {
    const upper = callsign.toUpperCase();
    if (upper.startsWith('SWL')) return 'SWL';
    // Class A: 9M2, 9M6, 9M8, 9M4?
    if (upper.startsWith('9M')) return 'A';

    // Class B: 9W2, 9W6, 9W8
    if (upper.startsWith('9W')) {
        // Exception for 9W3?
        if (upper.startsWith('9W3')) return 'C';
        return 'B';
    }

    return 'Unknown';
}

function getAge(dob: string): number {
    const birthDate = new Date(dob);
    const now = new Date();

    let age = now.getFullYear() - birthDate.getFullYear();
    const m = now.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export function isYOTA(dob: string | null | undefined): boolean {
    if (!dob) return false;
    const age = getAge(dob);
    return age <= 30;
}

export function getYotaRole(dob: string | null | undefined): 'Participant' | 'Leader' | null {
    if (!dob) return null;
    const age = getAge(dob);
    if (age <= 25) return 'Participant';
    if (age <= 30) return 'Leader';
    return null;
}

export function getMembershipStatus(expiry: string | null | undefined): { status: 'ACTIVE' | 'EXPIRED', expiryDate: string | null } {
    if (!expiry || expiry === '-') {
        return { status: 'EXPIRED', expiryDate: null };
    }

    if (expiry.toLowerCase().includes('life')) {
        return { status: 'ACTIVE', expiryDate: null };
    }

    try {
        const parts = expiry.split('/');
        const year = parseInt(parts[0]);
        // Default to December if month is missing, or parse month (1-based in string, 0-based in Date)
        const month = parts[1] ? parseInt(parts[1]) - 1 : 11;

        // Set to end of the month: day 0 of next month returns last day of current month
        const expiryDate = new Date(year, month + 1, 0, 23, 59, 59);
        const now = new Date();

        return {
            status: now > expiryDate ? 'EXPIRED' : 'ACTIVE',
            expiryDate: expiryDate.toISOString()
        };
    } catch (e) {
        console.error('Error parsing expiry date:', expiry, e);
        return { status: 'EXPIRED', expiryDate: null };
    }
}
