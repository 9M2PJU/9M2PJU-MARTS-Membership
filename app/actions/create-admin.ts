'use server';

import { createClient } from '@supabase/supabase-js';

// Initialize client lazily or check inside function to avoid top-level crash?
// Top-level crash on Vercel might result in 500 error for the action.
// Let's protect the initialization.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function createAdminUser(formData: FormData) {
    if (!supabaseServiceKey) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
        return { error: 'Server misconfiguration: Service Role Key is missing.' };
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string || 'admin';

    if (!email || !password) {
        return { error: 'Email and password are required' };
    }

    // 1. Create User in Supabase Auth
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true // Auto confirm
    });

    if (authError) {
        if (authError.message.includes('already registered')) {
            // User exists, just ensure they are in app_admins
            console.log('User exists, proceeding to role assignment');
        } else {
            return { error: authError.message };
        }
    }

    // 2. Insert into app_admins table
    const { error: dbError } = await supabaseAdmin
        .from('app_admins')
        .insert({
            email,
            role
        })
        .select()
        .single();

    if (dbError) {
        // If duplicate key in app_admins (email), just update role? 
        // Or return error if they are already an admin?
        // Let's return error for clarity.
        if (dbError.code === '23505') { // Unique violation
            return { error: 'Admin already exists with this email.' };
        }
        return { error: dbError.message };
    }

    return { success: true };
}
