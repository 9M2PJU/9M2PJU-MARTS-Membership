import { useState, useEffect } from 'react';
import { X, Save, Eraser } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Member } from './MemberCard';

interface EditMemberModalProps {
    member?: Member | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function EditMemberModal({ member, isOpen, onClose, onSave }: EditMemberModalProps) {
    const [formData, setFormData] = useState<Partial<Member>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (member) {
            setFormData({
                callsign: member.callsign,
                name: member.name,
                member_id: member.member_id,
                expiry: member.expiry,
                ic_number: member.ic_number || '',
                date_of_birth: member.date_of_birth || '',
                status: member.status || 'active',
                is_local: member.is_local
            });
        }
    }, [member]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!member) return;
        setLoading(true);

        const { error } = await supabase
            .from('members')
            .update(formData)
            .eq('id', member.id);

        setLoading(false);

        if (error) {
            alert('Error updating member: ' + error.message);
        } else {
            onSave();
            onClose();
        }
    };

    if (!isOpen || !member) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background border border-primary/20 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-white/10 bg-primary/5">
                    <h3 className="font-orbitron font-bold text-lg text-primary">EDIT MEMBER PROTOCOL</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 font-rajdhani">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-muted-foreground tracking-wider">Callsign</label>
                            <input
                                className="w-full bg-secondary/50 border border-input rounded p-2 focus:ring-2 focus:ring-primary/50 outline-none font-orbitron uppercase"
                                value={formData.callsign || ''}
                                onChange={e => setFormData({ ...formData, callsign: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-muted-foreground tracking-wider">Member ID</label>
                            <input
                                className="w-full bg-secondary/50 border border-input rounded p-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                value={formData.member_id || ''}
                                onChange={e => setFormData({ ...formData, member_id: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase text-muted-foreground tracking-wider">Full Name</label>
                        <input
                            className="w-full bg-secondary/50 border border-input rounded p-2 focus:ring-2 focus:ring-primary/50 outline-none"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-muted-foreground tracking-wider">Expiry (YYYY/MM)</label>
                            <input
                                className="w-full bg-secondary/50 border border-input rounded p-2 focus:ring-2 focus:ring-primary/50 outline-none font-mono"
                                value={formData.expiry || ''}
                                onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                                placeholder="2025/12"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-muted-foreground tracking-wider">Status</label>
                            <select
                                className="w-full bg-secondary/50 border border-input rounded p-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <option value="active">Active</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-primary/70 tracking-wider">Identity Card (Private)</label>
                            <input
                                className="w-full bg-secondary/30 border border-input/50 rounded p-2 focus:ring-2 focus:ring-primary/30 outline-none"
                                value={formData.ic_number || ''}
                                onChange={e => setFormData({ ...formData, ic_number: e.target.value })}
                                placeholder="######-##-####"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-primary/70 tracking-wider">Date of Birth (Private)</label>
                            <input
                                type="date"
                                className="w-full bg-secondary/30 border border-input/50 rounded p-2 focus:ring-2 focus:ring-primary/30 outline-none"
                                value={formData.date_of_birth || ''}
                                onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-muted-foreground hover:text-white font-rajdhani font-bold"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary text-background font-bold px-6 py-2 rounded flex items-center gap-2 hover:bg-primary/90 transition-colors font-orbitron"
                        >
                            {loading ? 'SAVING...' : <><Save className="w-4 h-4" /> SAVE CHANGES</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
