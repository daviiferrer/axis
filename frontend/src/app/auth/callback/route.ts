import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/app'

    // Determine the correct origin for redirect
    // In Docker/Production, request.url might be internal (0.0.0.0).
    // Prioritize NEXT_PUBLIC_API_URL, but FALLBACK to the hardcoded production domain
    // to prevent any 0.0.0.0 leakage.
    let origin = 'https://axischat.com.br' // Default SAFE origin
    if (process.env.NEXT_PUBLIC_API_URL) {
        try {
            const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL).origin
            if (apiOrigin && apiOrigin !== 'null') {
                origin = apiOrigin
            }
        } catch (e) {
            console.error('Failed to parse NEXT_PUBLIC_API_URL for origin', e)
        }
    }

    if (code) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Exchange the code for a session
        await supabase.auth.exchangeCodeForSession(code)
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${origin}${next}`)
}
