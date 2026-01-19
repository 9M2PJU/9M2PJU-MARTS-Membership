import { memo } from 'react';
import { Calendar, IdCard, Pencil, Trash2, Baby } from "lucide-react"
import { Member } from '@/app/page';
import { isYOTA } from '@/lib/callsign-utils';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MemberCardProps {
    member: Member;
    index: number;
    isAdmin: boolean;
    onEdit?: (member: Member) => void;
    onDelete?: (id: string) => void;
    onClick?: (member: Member) => void;
}

export const MemberCard = memo(function MemberCard({ member, index, isAdmin, onEdit, onDelete, onClick }: MemberCardProps) {
    // ... implementation
    // Helpers
    const isExpired = (expiryStr: string) => {
        if (!expiryStr || expiryStr === '-') return false;
        // Format YYYY or YYYY/MM
        const parts = expiryStr.split('/');
        const year = parseInt(parts[0]);
        const month = parts[1] ? parseInt(parts[1]) - 1 : 11; // End of year if month missing

        const expiryDate = new Date(year, month + 1, 0, 23, 59, 59); // Last day of month
        return new Date() > expiryDate;
    };

    const getStatus = (expiry: string) => {
        // Treat missing data as Expired (1900/01)
        const effectiveExpiry = (!expiry || expiry === '-') ? '1900/01' : expiry;

        const expired = isExpired(effectiveExpiry);
        const parts = effectiveExpiry.split('/');
        const year = parseInt(parts[0]);
        const month = parts[1] ? parseInt(parts[1]) - 1 : 11;
        const expiryDate = new Date(year, month + 1, 0, 23, 59, 59);

        // Check if expiring soon (this month)
        const now = new Date();
        const isExpiringSoon = !expired && expiryDate.getMonth() === now.getMonth() && expiryDate.getFullYear() === now.getFullYear();

        if (expired) return { label: 'High Council Expelled', color: 'bg-red-500/10 text-red-500 border-red-500/50' }; // Sith Red
        if (isExpiringSoon) return { label: 'System Failure Imminent', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50' };
        return { label: 'Force Strong', color: 'bg-primary/10 text-primary border-primary/50' }; // Jedi Blue/Gold
    };

    const status = getStatus(member.expiry);
    const isLocal = member.is_local;
    const isYouth = isYOTA(member.date_of_birth);

    // Format index strictly to 3 digits like #001, #045, #1999 (ok 4 digits if needed)
    const formattedIndex = index ? `#${index.toString().padStart(3, '0')}` : '';

    return (
        <div
            onClick={() => onClick?.(member)}
            className={cn(
                "relative group overflow-hidden rounded-xl border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,215,0,0.1)] cursor-pointer",
                status.label === 'High Council Expelled' ? 'hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] border-red-900/30' : 'border-primary/20'
            )}>

            {/* Scale/Index Number watermark */}
            {formattedIndex && (
                <div className="absolute -top-4 -left-2 text-[60px] font-black text-primary/5 font-orbitron select-none pointer-events-none z-0">
                    {formattedIndex.replace('#', '')}
                </div>
            )}

            {/* Glow Effect */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                "bg-gradient-to-br from-primary/5 via-transparent to-transparent"
            )} />

            <div className="p-5 flex flex-col gap-3 relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-primary/40 font-bold mb-1 font-orbitron">
                            {formattedIndex}
                        </div>
                        <h3 className="font-orbitron font-bold text-2xl tracking-wider text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                            {member.callsign}
                            {isYouth && (
                                <span className="inline-flex items-center gap-1 rounded bg-purple-500/20 border border-purple-500/50 px-1.5 py-0.5 text-[10px] text-purple-400 font-orbitron tracking-widest uppercase">
                                    <Baby className="w-3 h-3" /> YOTA
                                </span>
                            )}
                        </h3>
                        <p className="font-rajdhani font-medium text-muted-foreground text-sm line-clamp-1 mt-1" title={member.name}>
                            {member.name}
                        </p>
                    </div>
                    <div className={cn("px-2 py-1 rounded text-[10px] font-orbitron uppercase tracking-widest border", status.color)}>
                        {status.label === 'Force Strong' ? 'Active' : status.label === 'High Council Expelled' ? 'Expired' : 'Expiring'}
                    </div>
                </div>

                {/* Admin Controls */}
                {isAdmin && (
                    <div className="flex gap-2 mt-2 absolute top-2 right-2 z-50">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit?.(member); }}
                            className="bg-primary hover:bg-white text-black p-1.5 rounded-full transition-colors"
                            title="Edit"
                        >
                            <Pencil className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete?.(member.id); }}
                            className="bg-red-500 hover:bg-red-400 text-white p-1.5 rounded-full transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                )}

                <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-1" />

                <div className="grid grid-cols-2 gap-2 text-sm font-rajdhani">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <IdCard className="w-4 h-4 text-primary/70" />
                        <span>{member.member_id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground justify-end">
                        <Calendar className="w-4 h-4 text-primary/70" />
                        <span className={status.label === 'High Council Expelled' ? 'text-red-400' : 'text-foreground'}>
                            {member.expiry}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
});
