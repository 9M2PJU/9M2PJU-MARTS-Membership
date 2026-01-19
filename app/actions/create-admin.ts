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
            // User exists!
            // To allow Super Admin to "Reset" password, we just update it.
            // But we need the User ID first.

            // 1. Get User ID by Email using RPC (needs to be added to SQL)
            // Function must be: get_user_uid_by_email(check_email text) -> uuid
            // Call it as Super Admin via Service Role

            // Check if user is Super Admin? We should probably protect Super Admin accounts being overwritten by other admins if we had levels. 
            // But currently only Super Admin can call this effectively (UI protected).

            const { data: userId, error: rpcError } = await supabaseAdmin.rpc('get_user_uid_by_email', { check_email: email });

            if (rpcError || !userId) {
                console.error('RPC Error searching user', rpcError);
                return { error: 'User exists but could not locate ID for update. (SQL Function get_user_uid_by_email might be missing)' };
            }

            // 2. Update Password
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password: password }
            );

            if (updateError) {
                return { error: `Failed to update password: ${updateError.message}` };
            }

            // 3. Ensure role matches in database
            // Just upsert? Or check? 
            // Let's just update role too to be sure.
            const { error: roleError } = await supabaseAdmin
                .from('app_admins')
                .upsert({ email, role }, { onConflict: 'email' });

            if (roleError) console.error('Role update error', roleError);

            return { success: true, message: 'Existing Admin Password Updated.' };

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
