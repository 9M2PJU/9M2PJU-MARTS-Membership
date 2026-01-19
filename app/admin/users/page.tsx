'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Shield, ShieldAlert, UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { createAdminUser } from '@/app/actions/create-admin';

export default function AdminUsersPage() {
    const [admins, setAdmins] = useState<any[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState('');

    useEffect(() => {
        (async () => {
            await checkSuperAdmin();
            await fetchAdmins();
            setInitialLoading(false);
        })();
    }, []);

    const checkSuperAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('app_admins')
                .select('role')
                .ilike('email', user.email!)
                .single();
            setCurrentUserRole(data?.role || '');
        }
    };

    const fetchAdmins = async () => {
        // Do not set global loading here to avoid full page re-render flicker on refresh
        const { data, error } = await supabase.from('app_admins').select('*').order('created_at');
        if (!error) setAdmins(data || []);
    };

    // Old client-side function removed in favor of Server Action
    // const addAdmin = ...

    const removeAdmin = async (email: string) => {
        if (!confirm(`Revoke admin access for ${email}?`)) return;
        const { error } = await supabase.from('app_admins').delete().eq('email', email);
        if (error) alert(error.message);
        else fetchAdmins();
    };

    if (initialLoading) return <div className="p-8 text-center font-orbitron text-primary">SCANNING CLEARANCE LEVELS...</div>;

    if (currentUserRole !== 'super_admin') return (
        <div className="min-h-screen flex items-center justify-center text-red-500 font-orbitron text-2xl">
            <ShieldAlert className="w-12 h-12 mr-4" /> ACCESS DENIED
        </div>
    );

    return (
        <main className="min-h-screen p-8 max-w-4xl mx-auto relative">
            <div className="stars" />

            <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 font-rajdhani">
                <ArrowLeft className="w-4 h-4 mr-2" /> RETURN TO TERMINAL
            </Link>

            <h1 className="text-4xl font-orbitron font-bold text-primary mb-8 flex items-center gap-4">
                <Shield className="w-10 h-10" /> ADMIN MANAGEMENT
            </h1>

            {/* Update My Credentials */}
            <div className="bg-card/50 border border-primary/20 p-6 rounded-xl mb-8 backdrop-blur-md">
                <h3 className="text-lg font-orbitron text-foreground mb-4">UPDATE MY CREDENTIALS</h3>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const password = (e.currentTarget.elements.namedItem('myPassword') as HTMLInputElement).value;
                    if (!password || password.length < 6) {
                        alert('Password must be at least 6 characters.');
                        return;
                    }
                    if (!confirm('Are you sure you want to update your own password?')) return;

                    const { error } = await supabase.auth.updateUser({ password });
                    if (error) alert(error.message);
                    else {
                        alert('Password updated successfully. You can now login with this password.');
                        (e.target as HTMLFormElement).reset();
                    }
                }} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-xs font-orbitron text-primary mb-1 block">NEW PASSWORD</label>
                        <input
                            name="myPassword"
                            type="text"
                            placeholder="NewSecurePassword123"
                            className="w-full bg-secondary/50 border border-input rounded px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none font-mono"
                            required
                            minLength={6}
                        />
                    </div>
                    <button className="bg-amber-500 text-black font-bold px-6 py-2 rounded hover:bg-amber-400 flex items-center gap-2 font-orbitron">
                        <Shield className="w-4 h-4" /> UPDATE MY PASSWORD
                    </button>
                </form>
            </div>

            {/* Add New Admin */}
            <div className="bg-card/50 border border-primary/20 p-6 rounded-xl mb-8 backdrop-blur-md">
                <h3 className="text-lg font-orbitron text-foreground mb-4">GRANT CLEARANCE</h3>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setFormLoading(true);
                        const formData = new FormData(e.currentTarget);

                        try {
                            const res = await createAdminUser(formData);

                            if (res?.error) {
                                alert(res.error);
                            } else {
                                alert(res.message || 'Officer Access Granted.');
                                setNewEmail('');
                                setNewPassword('');
                                await fetchAdmins(); // Refresh list
                            }
                        } catch (err: any) {
                            const errorMsg = err?.message || 'Transmission Error';
                            alert(`Error: ${errorMsg}`);
                            console.error(err);
                        } finally {
                            setFormLoading(false);
                        }
                    }}
                    className="flex flex-col md:flex-row gap-4 items-end"
                >
                    <div className="flex-1 w-full">
                        <label className="text-xs font-orbitron text-primary mb-1 block">OFFICER EMAIL</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="officer@email.com"
                            className="w-full bg-secondary/50 border border-input rounded px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="text-xs font-orbitron text-primary mb-1 block">ACCESS CODE (PASSWORD)</label>
                        <input
                            name="password"
                            type="text" // Visible by default for admin convenience? Or password type? Let's use text for easy copying, or password for security. User asked to "set password", usually implies known value. Let's use text type but call it Access Code for theme.
                            placeholder="Secret123!"
                            className="w-full bg-secondary/50 border border-input rounded px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none font-mono"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <button disabled={formLoading} className="bg-primary text-background font-bold px-6 py-2 rounded hover:bg-primary/90 flex items-center gap-2 font-orbitron w-full md:w-auto justify-center disabled:opacity-50">
                        <UserPlus className="w-4 h-4" /> {formLoading ? 'PROCESSING...' : 'GRANT / UPDATE'}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {admins.map(admin => (
                    <div key={admin.id} className="flex items-center justify-between bg-secondary/20 border border-border p-4 rounded-lg">
                        <div>
                            <div className="font-rajdhani font-bold text-lg text-foreground">{admin.email}</div>
                            <div className={`text-xs font-orbitron px-2 py-0.5 rounded inline-block mt-1 ${admin.role === 'super_admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                {admin.role.toUpperCase().replace('_', ' ')}
                            </div>
                        </div>

                        {admin.role !== 'super_admin' && (
                            <button
                                onClick={() => removeAdmin(admin.email)}
                                className="text-red-500 hover:bg-red-500/10 p-2 rounded transition-colors"
                                title="Revoke Access"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </main>
    );
}
