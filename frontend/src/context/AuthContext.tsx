'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signInWithEmail: (email: string, password: string) => Promise<{ error: any }>
    signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: any }>
    signInWithGoogle: () => Promise<{ error: any }>
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signInWithEmail: async () => ({ error: null }),
    signUpWithEmail: async () => ({ error: null }),
    signInWithGoogle: async () => ({ error: null }),
    signOut: async () => { },
    refreshProfile: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const fetchUserWithProfile = useCallback(async (currentSession: Session | null) => {
        if (currentSession?.user) {
            try {
                // Fetch extra profile data
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('company_id, role')
                    .eq('id', currentSession.user.id)
                    .maybeSingle()

                if (profileError) {
                    console.error('[AuthContext] Error fetching profile:', profileError.message)
                }

                let companyId = profile?.company_id

                // Fallback: Check if user owns a company directly
                if (!companyId) {
                    const { data: ownedCompany } = await supabase
                        .from('companies')
                        .select('id')
                        .eq('owner_id', currentSession.user.id)
                        .maybeSingle()

                    if (ownedCompany) {
                        companyId = ownedCompany.id
                    }
                }

                // Construct final user object with profile data
                const userWithProfile = {
                    ...currentSession.user,
                    company_id: companyId,
                    role: profile?.role || 'owner'
                }

                setUser(userWithProfile as User & { company_id?: string, role: string })
            } catch (error) {
                console.error('[AuthContext] Unexpected error fetching profile:', error)
                setUser(currentSession.user)
            }
        } else {
            setUser(null)
        }
        setLoading(false)
    }, [])

    const refreshProfile = async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
            await fetchUserWithProfile(currentSession)
        }
    }

    useEffect(() => {
        // 1. Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            fetchUserWithProfile(session)
        })

        // 2. Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            // Re-fetch profile on auth change to ensure we have up-to-date role/company info
            fetchUserWithProfile(session)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [fetchUserWithProfile])

    const signInWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (!error) {
            // router.push('/app') // Handled by auth state change if needed, but explicit is fine. Keeping it for immediate feedback.
            router.push('/app')
        }
        return { error }
    }

    const signUpWithEmail = async (email: string, password: string, name: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        })
        return { error }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setSession(null)

        // Nuclear cleanup to fix persistent session issues
        if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
            // Also explicitly clear cookie if any? Supabase-js uses storage.
        }

        router.push('/auth/login')
        window.location.reload();
    }

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        return { error }
    }

    return (
        <AuthContext.Provider value={{ user, session, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
