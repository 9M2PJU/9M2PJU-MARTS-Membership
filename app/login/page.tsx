'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

function SimpleButton({ children, onClick, disabled, className }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 bg-primary text-background font-bold rounded hover:bg-primary/90 disabled:opacity-50 transition-colors ${className}`}
        >
            {children}
        </button>
    );
}

function SimpleInput({ type, placeholder, value, onChange, className }: any) {
    return (
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`w-full px-4 py-2 bg-secondary/50 border border-input rounded focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground ${className}`}
        />
    );
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordLogin, setIsPasswordLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        let result;

        if (isPasswordLogin) {
            result = await supabase.auth.signInWithPassword({
                email,
                password,
            });
        } else {
            // SECURITY CHECK: Verify email exists in restricted admin list first
            const { data: isAdmin, error: rpcError } = await supabase.rpc('check_is_admin', { check_email: email });

            if (rpcError) {
                console.error('RPC Error:', rpcError);
                // Fail safe: proceed if RPC fails but warn? Or strictly block? 
                // Let's block to be safe if user wants strict mode.
                setError('Security Check Failed. Access Denied.');
                setLoading(false);
                return;
            }

            if (!isAdmin) {
                setError('Access Denied. You are not an authorized officer.');
                setLoading(false);
                return;
            }

            result = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
                },
            });
        }

        const { error } = result;

        if (error) {
            setError(error.message);
        } else {
            if (isPasswordLogin) {
                window.location.href = '/';
            } else {
                setSent(true);
            }
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 relative">
            <div className="stars" />
            <div className="max-w-md w-full bg-card/50 backdrop-blur-md p-8 rounded-xl border border-primary/20 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-orbitron font-bold text-primary mb-2">System Access</h1>
                    <p className="text-muted-foreground font-rajdhani">Identify yourself, officer.</p>
                </div>

                {sent ? (
                    <div className="text-center space-y-4">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                        <h2 className="text-xl font-bold text-foreground">Link Sent</h2>
                        <p className="text-muted-foreground">Check your comms device ({email}) for the access link.</p>
                        <button onClick={() => setSent(false)} className="text-primary hover:underline text-sm font-rajdhani">Try again</button>
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <SimpleInput
                                type="email"
                                placeholder="name@callsign.my"
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                            />
                        </div>

                        {isPasswordLogin && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <SimpleInput
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e: any) => setPassword(e.target.value)}
                                />
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded flex items-center gap-2 text-red-500 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <SimpleButton disabled={loading} className="w-full font-orbitron tracking-widest">
                            {loading ? 'AUTHENTICATING...' : (isPasswordLogin ? 'LOGIN WITH PASSWORD' : 'SEND MAGIC LINK')}
                        </SimpleButton>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setIsPasswordLogin(!isPasswordLogin)}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors font-orbitron tracking-wider"
                            >
                                {isPasswordLogin ? 'USE MAGIC LINK INSTEAD' : 'LOGIN WITH PASSWORD'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </main>
    );
}
