import { supabase } from '@/lib/supabase';
import { getMembershipStatus } from '@/lib/callsign-utils';
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

        // Search for exact match OR "Callsign EX ..." OR "Callsign ( EX ..."
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .or(`callsign.ilike.${callsign},callsign.ilike.${callsign} EX %,callsign.ilike.${callsign} ( EX %`)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Not found
                return NextResponse.json({ found: false, message: 'Member not found' }, { status: 404, headers });
            }
            console.error('Supabase error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500, headers });
        }

        const { status, expiryDate } = getMembershipStatus(data.expiry);

        // Clean the callsign in the response (e.g. "9M2EDK EX 9W2EDK" -> "9M2EDK")
        const cleanName = data.callsign.replace(/\s*\(?\s*EX\b.*/i, '').trim();
        const memberData = {
            ...data,
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
