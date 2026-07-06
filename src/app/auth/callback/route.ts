import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Clean up large legacy avatar_data from session cookie to prevent HTTP 431
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user?.user_metadata?.avatar_data) {
                    await supabase.auth.updateUser({
                        data: {
                            ...user.user_metadata,
                            avatar_data: null
                        }
                    })
                }
            } catch (e) {
                console.error('Failed to clean up legacy avatar_data in callback:', e)
            }
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}/auth/error`)
}
