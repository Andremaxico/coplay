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
            // Clean up large legacy avatar_data and populate profile metadata/table
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const metadata = user.user_metadata || {}
                    
                    // Parse fields from Google metadata
                    const firstName = metadata.first_name || metadata.given_name || metadata.full_name?.split(' ')[0] || ''
                    const lastName = metadata.last_name || metadata.family_name || metadata.full_name?.split(' ').slice(1).join(' ') || ''
                    const avatarUrl = metadata.avatar_url || metadata.picture || null

                    // 1. Update user metadata
                    await supabase.auth.updateUser({
                        data: {
                            ...metadata,
                            first_name: firstName,
                            last_name: lastName,
                            avatar_url: avatarUrl,
                            avatar_data: null
                        }
                    })

                    // 2. Upsert row in profiles table
                    await supabase.from('profiles').upsert({
                        id: user.id,
                        first_name: firstName,
                        last_name: lastName,
                        avatar_url: avatarUrl,
                        updated_at: new Date().toISOString()
                    })
                }
            } catch (e) {
                console.error('Failed to initialize profile in callback:', e)
            }
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}/auth/error`)
}
