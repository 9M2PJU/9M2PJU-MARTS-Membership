'use client';

import { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import Image from 'next/image';

const POPUP_DELAY_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'donation_popup_dismissed';

interface DonationPopupProps {
    forceShow?: boolean;
    onClose?: () => void;
}

export function DonationPopup({ forceShow = false, onClose }: DonationPopupProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // If force show is true, show immediately
        if (forceShow) {
            setIsVisible(true);
            return;
        }

        // Check if popup was recently dismissed (within 24 hours)
        const dismissedAt = localStorage.getItem(STORAGE_KEY);
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const hoursSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60);
            if (hoursSinceDismiss < 24) {
                return; // Don't show popup if dismissed within 24 hours
            }
        }

        // Show popup after 5 minutes
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, POPUP_DELAY_MS);

        return () => clearTimeout(timer);
    }, [forceShow]);

    const handleClose = () => {
        setIsVisible(false);
        if (!forceShow) {
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
        }
        onClose?.();
    };

    if (!isVisible) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-start justify-center pt-[200px] md:pt-[180px] p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={handleClose}
        >
            <div
                className="relative bg-gradient-to-br from-background via-background to-primary/5 border border-primary/30 rounded-xl shadow-2xl w-full max-w-sm max-h-[70vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-white transition-colors z-10"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-primary/20 to-amber-500/20 p-4 text-center border-b border-primary/20">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 mb-2">
                        <Heart className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-orbitron font-bold text-lg text-primary">
                        Support MARTS Membership
                    </h2>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    <p className="text-foreground/80 text-center font-rajdhani text-xs leading-relaxed">
                        Help us cover server costs and keep this directory running for the Malaysian amateur radio community!
                    </p>

                    {/* QR Code */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="bg-white p-1.5 rounded-lg shadow-lg">
                            <Image
                                src="/duitnow-qr.png"
                                alt="DuitNow QR Code for Donation"
                                width={150}
                                height={150}
                                className="rounded"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center">
                            Scan with your banking or e-wallet app
                        </p>
                    </div>

                    {/* Thank You Message */}
                    <div className="text-center pt-2 border-t border-white/10">
                        <p className="text-xs text-primary/80 font-rajdhani">
                            Thank you for your support! 🙏
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-orbitron">
                            73 de 9M2PJU
                        </p>
                    </div>
                </div>

                {/* Footer Button */}
                <div className="p-3 bg-primary/5 border-t border-primary/20">
                    <button
                        onClick={handleClose}
                        className="w-full py-1.5 px-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary font-rajdhani font-bold text-sm transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
}

// Standalone button component for triggering donation popup
export function DonationButton() {
    const [showDonation, setShowDonation] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowDonation(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/30 rounded-lg text-pink-400 hover:from-pink-500/30 hover:to-red-500/30 transition-all font-orbitron text-xs tracking-widest"
            >
                <Heart className="w-3 h-3" /> DONATE
            </button>
            {showDonation && (
                <DonationPopup forceShow={true} onClose={() => setShowDonation(false)} />
            )}
        </>
    );
}
