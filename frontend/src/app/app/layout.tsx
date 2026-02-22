'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { AppSidebar } from "@/components/app-sidebar"
import { DataPrefetcher } from "@/components/DataPrefetcher"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    const isFlowPage = pathname?.includes('/flow')

    // Aceternity Sidebar Layout
    // Wrapper div is flex-row
    return (
        <div className="flex h-screen w-full bg-gray-100 dark:bg-neutral-900 overflow-hidden">
            {/* Prefetch all critical data on mount */}
            <DataPrefetcher />

            <div className="hidden md:flex h-full">
                {!isFlowPage && <AppSidebar />}
            </div>
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Content area */}
                <div className={`flex-1 w-full h-full transition-all duration-300 ease-in-out
                    ${isFlowPage
                        ? 'p-0 m-0 overflow-hidden bg-transparent shadow-none pb-[64px] md:pb-0' // Add padding for bottom nav on mobile
                        : 'bg-white dark:bg-neutral-900 shadow-sm overflow-y-auto p-2 md:p-4 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 m-2 md:ml-0 md:mt-2 md:mb-[72px] md:md:mb-2 md:mr-2' // Margin bottom for mobile nav
                    }
                `}>
                    {children}
                </div>
            </main>

            {!isFlowPage && <MobileBottomNav />}

            {/* GLOBAL ONBOARDING MODAL */}

        </div>
    )
}
