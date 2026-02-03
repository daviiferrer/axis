import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/app'

    // Determine the correct origin for redirect
    // In Docker/Production, request.url might be internal (0.0.0.0).
    // We prefer the explicit public API URL's origin if available.
    let origin = requestUrl.origin
    if (process.env.NEXT_PUBLIC_API_URL) {
        try {
            origin = new URL(process.env.NEXT_PUBLIC_API_URL).origin
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
