'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Shield, ShieldAlert, UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
    const [admins, setAdmins] = useState<any[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState('');

    useEffect(() => {
        checkSuperAdmin();
        fetchAdmins();
    }, []);

    const checkSuperAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('app_admins')
                .select('role')
                .eq('email', user.email)
                .single();
            setCurrentUserRole(data?.role || '');
        }
    };

    const fetchAdmins = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('app_admins').select('*').order('created_at');
        if (!error) setAdmins(data || []);
        setLoading(false);
    };

    const addAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('app_admins').insert({
            email: newEmail,
            role: 'admin' // Default to normal admin
        });

        if (error) alert(error.message);
        else {
            setNewEmail('');
            fetchAdmins();
        }
    };

    const removeAdmin = async (email: string) => {
        if (!confirm(`Revoke admin access for ${email}?`)) return;
        const { error } = await supabase.from('app_admins').delete().eq('email', email);
        if (error) alert(error.message);
        else fetchAdmins();
    };

    if (loading) return <div className="p-8 text-center font-orbitron text-primary">SCANNING CLEARANCE LEVELS...</div>;

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

            {/* Add New */}
            <div className="bg-card/50 border border-primary/20 p-6 rounded-xl mb-8 backdrop-blur-md">
                <h3 className="text-lg font-orbitron text-foreground mb-4">GRANT CLEARANCE</h3>
                <form onSubmit={addAdmin} className="flex gap-4">
                    <input
                        type="email"
                        placeholder="officer@email.com"
                        className="flex-1 bg-secondary/50 border border-input rounded px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        required
                    />
                    <button className="bg-primary text-background font-bold px-6 py-2 rounded hover:bg-primary/90 flex items-center gap-2 font-orbitron">
                        <UserPlus className="w-4 h-4" /> ADD ADMIN
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
