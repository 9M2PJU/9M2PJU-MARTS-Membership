import { Member } from "@/components/MemberCard";

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

export function isYOTA(dob: string | null | undefined): boolean {
    if (!dob) return false;

    const birthDate = new Date(dob);
    const now = new Date();

    let age = now.getFullYear() - birthDate.getFullYear();
    const m = now.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
        age--;
    }

    return age < 40;
}
