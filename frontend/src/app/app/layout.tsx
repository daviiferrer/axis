'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { AppSidebar } from "@/components/app-sidebar"
import { OnboardingModal } from "@/components/onboarding-modal"

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const router = useRouter()

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

    const pathname = usePathname()
    const isFlowPage = pathname?.includes('/flow')

    // Aceternity Sidebar Layout
    // Wrapper div is flex-row
    return (
        <div className="flex h-screen w-full bg-gray-100 dark:bg-neutral-900 overflow-hidden">
            <AppSidebar />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Content area */}
                <div className={`flex-1 w-full h-full bg-white dark:bg-neutral-900 shadow-sm
                    ${isFlowPage
                        ? 'p-0 m-0 overflow-hidden'
                        : 'overflow-y-auto p-2 md:p-4 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 m-2 md:ml-0 md:mt-2 md:mb-2 md:mr-2'
                    }
                `}>
                    {children}
                </div>
            </main>

            {/* GLOBAL ONBOARDING MODAL */}
            <OnboardingModal />
        </div>
    )
}
