export interface Member {
    id: string;
    callsign: string;
    name: string;
    member_id: string;
    expiry: string;
    is_local: boolean;
    date_of_birth: string | null;
    created_at: string;
    status?: 'active' | 'expired'; // Optional as it might be calculated
    ic_number?: string | null; // Sensitive, might not always be present
}
