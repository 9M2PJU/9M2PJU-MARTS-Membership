import { supabase } from '@/lib/supabase';
import { getMembershipStatus, cleanCallsign } from '@/lib/callsign-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ callsign: string }> }
) {
    const { callsign } = await params;

    // Add CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*', // Be sure to restrict this in production if needed, or allow extension ID
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle OPTIONS request for CORS preflight
    if (request.method === 'OPTIONS') {
        return NextResponse.json({}, { headers });
    }

    try {
        if (!callsign) {
            return NextResponse.json({ error: 'Callsign required' }, { status: 400, headers });
        }

        // Search logic:
        // 1. Exact match
        // 2. Starts with "CALLSIGN " (e.g. "9M2HIM EX 9W2NKL")
        // 3. Starts with "CALLSIGN(" (e.g. "9M2HIM(EX...")
        // 4. Contains " EX CALLSIGN" at the end or followed by closing paren (searches for old callsign)
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .or(`callsign.ilike.${callsign},callsign.ilike.${callsign} %,callsign.ilike.${callsign}(%,callsign.ilike.% EX ${callsign},callsign.ilike.% EX ${callsign})%`)
            .limit(5); // Allow multiple matches

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500, headers });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ found: false, message: 'Member not found' }, { status: 404, headers });
        }

        // Prioritize: Find exact match of the clean callsign
        // If the search term matches the *current* callsign of a record, that record takes priority
        // over records where the search term only matches the "formerly known as" part.
        let bestMatch = data[0];

        const searchCallsignNormalized = callsign.toUpperCase().trim();
        const exactMatch = data.find(record => {
            const currentCallsign = cleanCallsign(record.callsign).toUpperCase();
            return currentCallsign === searchCallsignNormalized;
        });

        if (exactMatch) {
            bestMatch = exactMatch;
        }

        const { status, expiryDate } = getMembershipStatus(bestMatch.expiry);

        const cleanName = cleanCallsign(bestMatch.callsign);
        const memberData = {
            ...bestMatch,
            callsign: cleanName
        };

        return NextResponse.json({
            found: true,
            member: memberData,
            status,
            calculated_expiry_date: expiryDate
        }, { status: 200, headers });

    } catch (error: any) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers });
    }
}

export async function OPTIONS() {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    return NextResponse.json({}, { headers });
}
