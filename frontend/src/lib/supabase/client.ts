import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
    if (supabaseInstance) return supabaseInstance

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Missing Supabase environment variables. Authentication will not work.')
        // Return a dummy client for build time
        return createClient('https://placeholder.supabase.co', 'placeholder-key')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
    return supabaseInstance
}

// For backward compatibility - lazy getter
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        return (getSupabase() as any)[prop]
    }
})
