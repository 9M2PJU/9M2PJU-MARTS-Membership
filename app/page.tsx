'use client';

import { useState, useMemo, useEffect } from 'react';
import { MemberCard, Member } from '@/components/MemberCard';
import { EditMemberModal } from '@/components/EditMemberModal';
import { Search, Filter, RefreshCw, Smartphone, LogIn, Shield, LogOut, UserPlus, Baby } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getRegion, getLicenseClass, isYOTA, Region, LicenseClass } from '@/lib/callsign-utils';
import Link from 'next/link';

// Mock UI components if missing tailored for this file
const MyButton = ({ children, onClick, className, variant, size }: any) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg font-orbitron tracking-widest transition-all ${className} ${variant === 'outline' ? 'border border-primary text-primary hover:bg-primary/10' : 'bg-primary text-background hover:bg-primary/90'}`}
    >
        {children}
    </button>
);

export default function Home() {
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [regionFilter, setRegionFilter] = useState<Region | 'All'>('All');
    const [classFilter, setClassFilter] = useState<LicenseClass | 'All'>('All');
    const [yotaFilter, setYotaFilter] = useState(false);
    const [page, setPage] = useState(1);

    // Modal State
    const [editingMember, setEditingMember] = useState<Member | null>(null);

    // ... (Auth effects remain) ...

    const handleEdit = (member: Member) => {
        setEditingMember(member);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('WARNING: Are you sure you want to delete this member? This action cannot be undone.')) return;

        const { error } = await supabase.from('members').delete().eq('id', id);
        if (error) {
            alert('Error deleting member: ' + error.message);
        } else {
            fetchData(); // Refresh
        }
    };

    const handleSave = () => {
        fetchData(); // Refresh list after edit
    };
    const ITEMS_PER_PAGE = 24;

    // Auth State
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        fetchData();
        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) checkRole(session.user.email);
            else {
                setIsAdmin(false);
                setIsSuperAdmin(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Fetch from Supabase
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('callsign', { ascending: true })
            .limit(10000); // Override default 1000 limit

        if (error) {
            console.error('Error fetching members:', error);
            // Fallback or empty
        } else {
            setAllMembers(data || []);
        }
        setLoading(false);
    };

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) checkRole(user.email);
    };

    const checkRole = async (email: string | undefined) => {
        if (!email) return;
        const { data, error } = await supabase
            .from('app_admins')
            .select('role')
            .eq('email', email)
            .single();

        if (data) {
            setIsAdmin(true);
            if (data.role === 'super_admin') setIsSuperAdmin(true);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
    };

    const stats = useMemo(() => {
        const total = allMembers.length;
        let active = 0;
        let expired = 0;
        // Reuse expiry logic broadly (simplified for stats)
        allMembers.forEach(m => {
            if (!m.expiry || m.expiry === '-') return;
            const parts = m.expiry.split('/');
            const year = parseInt(parts[0]);
            const month = parts[1] ? parseInt(parts[1]) - 1 : 11;
            const expiryDate = new Date(year, month + 1, 0, 23, 59, 59);
            if (new Date() > expiryDate) expired++;
            else active++;
        });
        return { total, active, expired };
    }, [allMembers]);

    const filteredMembers = useMemo(() => {
        let result = allMembers;

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(m =>
                m.callsign.toLowerCase().includes(q) ||
                m.name?.toLowerCase().includes(q) ||
                m.member_id?.includes(q)
            );
        }

        // Filter Chain
        result = result.filter(m => {
            // 1. Status Filter
            if (statusFilter !== 'all') {
                const now = new Date();
                if (!m.expiry) return false;
                const parts = m.expiry.split('/');
                const year = parseInt(parts[0]);
                const month = parts[1] ? parseInt(parts[1]) - 1 : 11;
                const expiryDate = new Date(year, month + 1, 0, 23, 59, 59);
                const isExpired = now > expiryDate;
                if (statusFilter === 'active' && isExpired) return false;
                if (statusFilter === 'expired' && !isExpired) return false;
            }

            // 2. Region Filter
            if (regionFilter !== 'All') {
                if (getRegion(m.callsign) !== regionFilter) return false;
            }

            // 3. Class Filter
            if (classFilter !== 'All') {
                if (getLicenseClass(m.callsign) !== classFilter) return false;
            }

            // 4. YOTA Filter
            if (yotaFilter) {
                if (!isYOTA(m.date_of_birth)) return false;
            }

            return true;
        });

        return result;
    }, [allMembers, search, statusFilter, regionFilter, classFilter, yotaFilter]);

    const displayedMembers = filteredMembers.slice(0, page * ITEMS_PER_PAGE);
    const showLoadMore = displayedMembers.length < filteredMembers.length;

    return (
        <main className="min-h-screen relative p-4 md:p-8 max-w-7xl mx-auto">
            {/* Background & Effects */}
            <div className="stars" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none z-[-1]" />

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 relative z-10">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-amber-500 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                        MARTS
                    </h1>
                    <p className="text-muted-foreground font-rajdhani tracking-widest uppercase mt-2 text-sm md:text-base">
                        Membership Database Access Terminal
                    </p>
                </div>

                {/* Stats & Auth */}
                <div className="flex flex-col gap-4 items-end">
                    <div className="flex gap-4 md:gap-8 bg-card/40 backdrop-blur-md p-4 rounded-xl border border-primary/20">
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-orbitron font-bold text-foreground">{stats.total}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
                        </div>
                        <div className="w-px bg-border"></div>
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-orbitron font-bold text-primary drop-shadow-[0_0_5px_var(--primary)]">{stats.active}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</div>
                        </div>
                        <div className="w-px bg-border"></div>
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-orbitron font-bold text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">{stats.expired}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Expired</div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {user ? (
                            <>
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded text-green-500 text-xs font-orbitron">
                                    <Shield className="w-3 h-3" />
                                    {isAdmin ? (isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN') : 'MEMBER'}
                                </div>
                                {isSuperAdmin && (
                                    <Link href="/admin/users">
                                        <MyButton variant="outline" className="text-xs py-1">MANAGE ADMINS</MyButton>
                                    </Link>
                                )}
                                <MyButton onClick={handleLogout} variant="outline" className="text-xs py-1 flex items-center gap-2">
                                    <LogOut className="w-3 h-3" /> LOGOUT
                                </MyButton>
                            </>
                        ) : (
                            <Link href="/login">
                                <MyButton className="text-xs py-1 flex items-center gap-2">
                                    <LogIn className="w-3 h-3" /> ADMIN ACCESS
                                </MyButton>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Controls */}
            <div className="sticky top-4 z-50 mb-8 space-y-4">
                <div className="flex flex-col gap-4 bg-background/80 backdrop-blur-xl p-4 rounded-2xl border border-primary/10 shadow-xl">
                    {/* Top Row: Search */}
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search callsign, name, ID..."
                            className="w-full bg-secondary/50 border border-input rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-rajdhani text-lg"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Bottom Row: Filters */}
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                        {/* Status (Tabs) */}
                        <div className="flex bg-secondary/50 p-1 rounded-lg">
                            {['all', 'active', 'expired'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-md font-orbitron text-[10px] tracking-widest transition-all uppercase ${statusFilter === s ? 'bg-primary text-background font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <div className="h-4 w-px bg-border/50 hidden md:block"></div>

                        {/* Region */}
                        <div className="flex bg-secondary/50 p-1 rounded-lg overflow-x-auto max-w-[200px] md:max-w-none">
                            {['All', 'West Malaysia', 'Sabah', 'Sarawak', 'Foreign'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRegionFilter(r as any)}
                                    className={`px-3 py-1.5 rounded-md font-orbitron text-[10px] tracking-widest transition-all whitespace-nowrap uppercase ${regionFilter === r ? 'bg-blue-500 text-white font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        {/* Class */}
                        <div className="flex bg-secondary/50 p-1 rounded-lg">
                            {['All', 'A', 'B', 'C'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setClassFilter(c as any)}
                                    className={`px-3 py-1.5 rounded-md font-orbitron text-[10px] tracking-widest transition-all uppercase ${classFilter === c ? 'bg-amber-500 text-black font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {c === 'All' ? 'Class' : c}
                                </button>
                            ))}
                        </div>

                        {/* YOTA Toggle */}
                        <button
                            onClick={() => setYotaFilter(!yotaFilter)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-orbitron text-[10px] tracking-widest transition-all border ${yotaFilter ? 'bg-purple-500 text-white border-purple-500 shadow-[0_0_10px_var(--purple-500)]' : 'bg-transparent border-purple-500/30 text-purple-400 hover:bg-purple-500/10'}`}
                        >
                            <Baby className="w-3 h-3" /> YOTA
                        </button>
                    </div>
                </div>
            </div>

            {/* Admin Add Button */}
            {isAdmin && (
                <div className="flex justify-end mb-4">
                    <MyButton className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> ADD NEW MEMBER
                    </MyButton>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {displayedMembers.map(member => (
                    <MemberCard
                        key={member.id}
                        member={member}
                        isAdmin={isAdmin}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
                {!loading && displayedMembers.length === 0 && (
                    <div className="col-span-full py-20 text-center text-muted-foreground font-rajdhani text-xl">
                        No members found matching your search coordinates.
                    </div>
                )}
                {loading && (
                    <div className="col-span-full py-20 text-center text-primary font-orbitron animate-pulse">
                        INITIALIZING DATA STREAM...
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <EditMemberModal
                member={editingMember}
                isOpen={!!editingMember}
                onClose={() => setEditingMember(null)}
                onSave={handleSave}
            />

            {/* Load More */}
            {showLoadMore && (
                <div className="flex justify-center pb-20">
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="px-8 py-4 bg-secondary/80 hover:bg-primary hover:text-background border border-primary/30 rounded-full font-orbitron tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_var(--primary)]"
                    >
                        LOAD MORE DATA
                    </button>
                </div>
            )}
        </main>
    );
}
