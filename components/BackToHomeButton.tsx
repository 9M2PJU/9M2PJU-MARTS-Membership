'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export default function BackToHomeButton() {
    const pathname = usePathname()
    const router = useRouter()
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            // Show button after scrolling down 300px on home page
            // Or always show if not on home page
            if (pathname === '/') {
                setIsVisible(window.scrollY > 300)
            } else {
                setIsVisible(true)
            }
        }

        // Initial check
        handleScroll()

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [pathname])

    const handleClick = () => {
        if (pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
            router.push('/')
        }
    }

    if (!isVisible) return null

    return (
        <button
            onClick={handleClick}
            className={cn(
                "fixed bottom-6 right-6 z-[9999]",
                "p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
                "bg-primary text-primary-foreground",
                "border border-primary/20",
                "flex items-center gap-2",
                "group hover:pr-4",
                "animate-in fade-in slide-in-from-bottom-4 duration-500"
            )}
            aria-label={pathname === '/' ? "Scroll to top" : "Back to Home"}
        >
            {pathname === '/' ? (
                <>
                    <ArrowUp className="w-5 h-5" />
                    <span className="w-0 overflow-hidden group-hover:w-auto group-hover:ml-1 transition-all duration-300 whitespace-nowrap text-sm font-medium">
                        Top
                    </span>
                </>
            ) : (
                <>
                    <Home className="w-5 h-5" />
                    <span className="w-0 overflow-hidden group-hover:w-auto group-hover:ml-1 transition-all duration-300 whitespace-nowrap text-sm font-medium">
                        Home
                    </span>
                </>
            )}
        </button>
    )
}
