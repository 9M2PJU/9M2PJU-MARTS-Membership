'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { MemberCard, Member } from '@/components/MemberCard';
import { EditMemberModal } from '@/components/EditMemberModal';
import { Search, Filter, RefreshCw, Smartphone, LogIn, Shield, LogOut, UserPlus, Baby } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getRegion, getLicenseClass, isYOTA, Region, LicenseClass } from '@/lib/callsign-utils';
import Link from 'next/link';
import Image from 'next/image';

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
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Performance: Debounce search input to avoid re-filtering 2000+ items on every keystroke
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    // ... existing filters ...
    const [statusFilter, setStatusFilter] = useState('all');
    const [regionFilter, setRegionFilter] = useState<Region | 'All'>('All');
    const [classFilter, setClassFilter] = useState<LicenseClass | 'All'>('All');
    const [yotaFilter, setYotaFilter] = useState(false);
    const [page, setPage] = useState(1);
    const observerTarget = useRef(null); // Ref for infinite scroll

    // Modal State
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        console.log('🚀 Starting optimized parallel fetch...');

        // Performance: Parallel fetching to maximize bandwidth usage and reduce load time.
        // We fetch 5 chunks of 500 records (Total capability: 2500) simultaneously.
        // This is significantly faster than sequential "waterfall" fetching.
        const chunkStarts = [0, 500, 1000, 1500, 2000];

        const promises = chunkStarts.map(from =>
            supabase
                .from('members')
                .select('*')
                .order('created_at', { ascending: false })
                .order('id', { ascending: true })
                .range(from, from + 499)
        );

        const results = await Promise.all(promises);

        let allData: Member[] = [];
        results.forEach(result => {
            if (result.data) {
                allData = [...allData, ...result.data];
            } else if (result.error) {
                console.error('Error fetching chunk:', result.error);
            }
        });

        // Deduplicate just in case of range overlaps (unlikely but safe)
        const uniqueMembers = Array.from(new Map(allData.map(item => [item.id, item])).values());

        console.log(`✅ Total members fetched (parallel): ${uniqueMembers.length}`);
        setAllMembers(uniqueMembers);
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
            .ilike('email', email)
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

    const handleEdit = (member: Member) => {
        console.log('Edit clicked for:', member.callsign);
        setEditingMember(member);
        setIsModalOpen(true);
    };

    const handleView = (member: Member) => {
        console.log('View clicked for:', member.callsign);
        setEditingMember(member);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingMember(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        console.log('Delete requested for:', id);
        if (!confirm('WARNING: Are you sure you want to delete this member? This action cannot be undone.')) return;

        const { error } = await supabase.from('members').delete().eq('id', id);
        if (error) {
            alert('Error deleting member: ' + error.message);
        } else {
            fetchData(); // Refresh
        }
    };

    const handleReset = () => {
        setSearch('');
        setStatusFilter('all');
        setRegionFilter('All');
        setClassFilter('All');
        setYotaFilter(false);
        setPage(1);
    };

    const handleSave = () => {
        fetchData(); // Refresh list after edit
    };
    const ITEMS_PER_PAGE = 24;

    const stats = useMemo(() => {
        const total = allMembers.length;
        let active = 0;
        let expired = 0;

        allMembers.forEach(m => {
            // Treat missing or dummy dates as Expired (default to 1900)
            const expiryStr = (m.expiry && m.expiry !== '-') ? m.expiry : '1900/01';

            const parts = expiryStr.split('/');
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
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
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
    }, [allMembers, debouncedSearch, statusFilter, regionFilter, classFilter, yotaFilter]);

    const displayedMembers = filteredMembers.slice(0, page * ITEMS_PER_PAGE);
    const showLoadMore = displayedMembers.length < filteredMembers.length;

    // Infinite Scroll Effect
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && showLoadMore) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [showLoadMore]); // Re-run when showLoadMore changes to ensure fresh state

    return (
        <main className="min-h-screen relative p-4 md:p-8 max-w-7xl mx-auto">
            {/* Background & Effects */}
            <div className="stars" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none z-[-1]" />

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-12 gap-6 relative z-10">
                <div className="text-center md:text-left">
                    <div className="flex flex-row items-center justify-center md:justify-start gap-4 mb-2">
                        <Image
                            src="/logo.png"
                            alt="MARTS Logo"
                            width={80}
                            height={120}
                            className="w-16 md:w-24 h-auto drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                            priority
                        />
                        <h1
                            onClick={handleReset}
                            className="text-3xl md:text-6xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-amber-500 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] cursor-pointer hover:opacity-90 transition-opacity select-none"
                        >
                            MARTS
                        </h1>
                    </div>
                    <p className="text-muted-foreground font-rajdhani tracking-widest uppercase mt-2 text-xs md:text-base">
                        Unofficial MARTS Membership Database. Made for 🇲🇾 by <a href="https://hamradio.my" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-amber-400 transition-colors">9M2PJU</a>
                    </p>
                </div>

                {/* Stats & Auth */}
                <div className="flex flex-col gap-4 items-end w-full md:w-auto">
                    <div className="flex justify-between md:justify-start gap-4 md:gap-8 bg-card/40 backdrop-blur-md p-4 rounded-xl border border-primary/20 w-full md:w-auto">
                        <div className="text-center flex-1 md:flex-none">
                            <div className="text-xl md:text-3xl font-orbitron font-bold text-foreground">{stats.total}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
                        </div>
                        <div className="w-px bg-border"></div>
                        <div className="text-center flex-1 md:flex-none">
                            <div className="text-xl md:text-3xl font-orbitron font-bold text-primary drop-shadow-[0_0_5px_var(--primary)]">{stats.active}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</div>
                        </div>
                        <div className="w-px bg-border"></div>
                        <div className="text-center flex-1 md:flex-none">
                            <div className="text-xl md:text-3xl font-orbitron font-bold text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">{stats.expired}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Expired</div>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto justify-end">
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

                        <div className="flex bg-secondary/50 p-1 rounded-lg flex-wrap md:flex-nowrap justify-center md:justify-start">
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
                            {['All', 'A', 'B', 'C', 'SWL'].map(c => (
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
                    <MyButton onClick={handleAdd} className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> ADD NEW MEMBER
                    </MyButton>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {displayedMembers.map((member, i) => (
                    <MemberCard
                        key={member.id}
                        index={i + 1}
                        member={member}
                        isAdmin={isAdmin}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onClick={handleView}
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

            {/* Edit/View Modal */}
            <EditMemberModal
                member={editingMember}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                isSuperAdmin={isSuperAdmin}
                readOnly={!isAdmin && !isSuperAdmin && !!editingMember} // Read-only if user is NOT (admin or superadmin), AND we are editing an existing member (implied by editingMember not null). Wait. If I am admin, editingMember is not null, so !true -> false. Mode is NOT read only. Correct. If I am user (!false), editingMember is not null, !false -> true. Read only. Correct.
            />

            {/* Infinite Scroll Sentinel */}
            {showLoadMore && (
                <div ref={observerTarget} className="flex justify-center pb-20 py-10 opacity-0">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            )}
        </main>
    );
}
