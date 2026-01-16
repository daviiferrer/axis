import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/app'

    if (code) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Exchange the code for a session
        // Note: Since we are using client-side auth mainly, this server-side exchange 
        // is ensuring the session is set in cookies if we were using the SSR helper,
        // but here we just want to ensure the verification passed.
        // However, for pure client-side flows, the client handles the fragment.
        // But standard Supabase callback usually expects a code exchange on server or middleware.
        // Let's keep it simple: specific handling for 'code' usually implies PKCE flow.

        // We actually need @supabase/ssr to properly handle cookies in Next.js App Router for
        // server-side session, but since we built a Client-Side Context, 
        // we can simply redirect to the landing page where the Supabase Client will detect the session from the URL hash 
        // OR if using PKCE with code, we must exchange it.

        // Simplest approach for now consistent with our client-only setup:
        // Supabase auth helper usually handles this auto-magically. 
        // without the helper, we might need manual exchange.

        // For now, let's redirect to dashboard, but usually we need:
        await supabase.auth.exchangeCodeForSession(code)
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${origin}${next}`)
}
