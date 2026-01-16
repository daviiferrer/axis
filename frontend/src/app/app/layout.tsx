'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppSidebar } from "@/components/app-sidebar"

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

    // Aceternity Sidebar Layout
    // Wrapper div is flex-row
    return (
        <div className="flex h-screen w-full bg-gray-100 dark:bg-neutral-900 overflow-hidden">
            <AppSidebar />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Content area */}
                <div className="flex-1 overflow-y-auto w-full h-full p-2 md:p-4 bg-white dark:bg-neutral-900 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 m-2 md:ml-0 md:mt-2 md:mb-2 md:mr-2 shadow-sm">
                    {children}
                </div>
            </main>
        </div>
    )
}
