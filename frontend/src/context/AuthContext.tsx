'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signInWithEmail: async () => ({ error: null }),
    signUpWithEmail: async () => ({ error: null }),
    signInWithGoogle: async () => ({ error: null }),
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchUserWithProfile = async (session: Session | null) => {
            if (session?.user) {
                try {
                    // Fetch extra profile data
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('company_id, is_super_admin')
                        .eq('id', session.user.id)
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
                            .eq('owner_id', session.user.id)
                            .maybeSingle()

                        if (ownedCompany) {
                            companyId = ownedCompany.id
                        }
                    }

                    // Construct final user object with profile data
                    const userWithProfile = {
                        ...session.user,
                        company_id: companyId,
                        is_super_admin: profile?.is_super_admin || false
                    }

                    setUser(userWithProfile as User & { company_id?: string, is_super_admin?: boolean })
                } catch (error) {
                    console.error('[AuthContext] Unexpected error fetching profile:', error)
                    setUser(session.user)
                }
            } else {
                setUser(null)
            }
            setLoading(false)
        }

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
    }, [])

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
            options: {
                data: {
                    full_name: name,
                },
            },
        })
        return { error }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
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
        <AuthContext.Provider value={{ user, session, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
