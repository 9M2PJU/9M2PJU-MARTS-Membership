import type { Metadata } from 'next'
import { Inter, Orbitron, Rajdhani } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-rajdhani' })

export const metadata: Metadata = {
    title: 'MARTS Membership Directory',
    description: 'Unofficial Malaysian Amateur Radio Transmitters\' Society Membership Directory',
}

import BackToHomeButton from '@/components/BackToHomeButton'
import CursorTrails from '@/components/CursorTrails'
import { DonationPopup } from '@/components/DonationPopup'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={cn(inter.variable, orbitron.variable, rajdhani.variable, "font-sans antialiased min-h-screen flex flex-col")}>
                <CursorTrails />
                <div className="flex-grow">
                    {children}
                </div>
                <BackToHomeButton />
                <DonationPopup />
                <footer className="w-full py-6 text-center text-sm text-muted-foreground border-t border-border/40 backdrop-blur-md bg-background/80">
                    <p>
                        © {new Date().getFullYear()} Unofficial Malaysian Amateur Radio Transmitters' Society Membership Database. Made for 🇲🇾 by <a href="https://hamradio.my" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">9M2PJU</a>
                    </p>
                </footer>
            </body>
        </html>
    )
}
