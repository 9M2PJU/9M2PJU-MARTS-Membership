import type { Metadata } from 'next'
import { Inter, Orbitron, Rajdhani } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-rajdhani' })

export const metadata: Metadata = {
    title: 'MARTS Membership Directory',
    description: 'Official Malaysian Amateur Radio Transmitters\' Society Membership Directory',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={cn(inter.variable, orbitron.variable, rajdhani.variable, "font-sans antialiased min-h-screen flex flex-col")}>
                <div className="flex-grow">
                    {children}
                </div>
                <footer className="w-full py-6 text-center text-sm text-muted-foreground border-t border-border/40 backdrop-blur-md bg-background/80">
                    <p className="flex items-center justify-center gap-4">
                        <span>© 2026 MARTS</span>
                        <span>•</span>
                        <a href="https://marts.org.my" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">marts.org.my</a>
                    </p>
                </footer>
            </body>
        </html>
    )
}
