'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BackToHomeButton() {
    const pathname = usePathname()
    const router = useRouter()

    // Don't show on home page
    if (pathname === '/') return null

    return (
        <button
            onClick={() => router.push('/')}
            className={cn(
                "fixed bottom-6 right-6 z-50",
                "p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
                "bg-primary text-primary-foreground",
                "border border-primary/20",
                "flex items-center gap-2",
                "group hover:pr-4"
            )}
            aria-label="Back to Home"
        >
            <Home className="w-5 h-5" />
            <span className="w-0 overflow-hidden group-hover:w-auto group-hover:ml-1 transition-all duration-300 whitespace-nowrap text-sm font-medium">
                Home
            </span>
        </button>
    )
}
