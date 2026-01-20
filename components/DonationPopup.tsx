'use client';

import { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import Image from 'next/image';

const INITIAL_DELAY_MS = 3 * 1000; // 3 seconds for new users
const REPOPUP_HOURS = 1; // Re-show popup after 1 hour
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

        // Check if popup was recently dismissed
        const dismissedAt = localStorage.getItem(STORAGE_KEY);
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const hoursSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60);
            if (hoursSinceDismiss < REPOPUP_HOURS) {
                return; // Don't show popup if dismissed within the hour
            }
        }

        // Show popup after short delay (3 seconds)
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, INITIAL_DELAY_MS);

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
            className="fixed inset-0 z-[9999] isolate flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={handleClose}
        >
            <div
                className="relative bg-gradient-to-br from-background via-background to-primary/5 border border-primary/30 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-white transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-primary/20 to-amber-500/20 p-6 text-center border-b border-primary/20">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-3">
                        <Heart className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="font-orbitron font-bold text-base text-primary leading-tight">
                        Support Unofficial MARTS Membership Database by 9M2PJU
                    </h2>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-foreground/80 text-center font-rajdhani text-sm leading-relaxed">
                        Help us cover server maintenance costs and keep MARTS Membership Directory running smoothly for the Malaysian amateur radio community. Every contribution, big or small, makes a difference!
                    </p>

                    {/* QR Code */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="bg-white p-2 rounded-xl shadow-lg">
                            <Image
                                src="/duitnow-qr.png"
                                alt="DuitNow QR Code for Donation"
                                width={200}
                                height={200}
                                className="rounded-lg"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Scan with your banking or e-wallet app to donate
                        </p>
                    </div>

                    {/* Thank You Message */}
                    <div className="text-center pt-2 border-t border-white/10">
                        <p className="text-sm text-primary/80 font-rajdhani">
                            Thank you for your generous support! 🙏
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 font-orbitron">
                            73 de 9M2PJU
                        </p>
                    </div>
                </div>

                {/* Footer Button */}
                <div className="p-4 bg-primary/5 border-t border-primary/20">
                    <button
                        onClick={handleClose}
                        className="w-full py-2 px-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary font-rajdhani font-bold transition-colors"
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
