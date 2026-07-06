'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signInWithGoogle() {
    const supabase = await createClient()
    const headersList = await headers()
    const origin = headersList.get('origin')

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) redirect('/auth/error')
    if (data.url) redirect(data.url)
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
}

export async function loginWithEmail(email: string, password: string) {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
        return { error: error.message }
    }

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
        console.error('Failed to clean up legacy avatar_data:', e)
    }

    return { success: true }
}

export async function signUpWithEmail(email: string, password: string) {
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
        return { error: error.message }
    }
    return { success: true }
}

export async function updateProfileMetadata(metadata: {
    avatar_data?: string
    first_name?: string
    last_name?: string
    phone?: string
    telegram?: string
    main_sport?: string
}) {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
        return { error: 'Неавторизовано' }
    }

    let avatarUrl = user.user_metadata?.avatar_url || null

    if (metadata.avatar_data && metadata.avatar_data.startsWith('data:image')) {
        try {
            const base64Data = metadata.avatar_data.replace(/^data:image\/\w+;base64,/, '')
            const buffer = Buffer.from(base64Data, 'base64')
            const filePath = `${user.id}/avatar.jpg`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, buffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                })

            if (uploadError) {
                // Try to create avatars bucket if it doesn't exist
                await supabase.storage.createBucket('avatars', { public: true })
                const { error: retryError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, buffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    })
                if (retryError) {
                    return { error: `Помилка завантаження у сховище: ${retryError.message}` }
                }
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            avatarUrl = publicUrl
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Невідома помилка'
            return { error: `Помилка обробки файлу: ${msg}` }
        }
    }

    const { error } = await supabase.auth.updateUser({
        data: {
            ...user.user_metadata,
            first_name: metadata.first_name,
            last_name: metadata.last_name,
            phone: metadata.phone,
            telegram: metadata.telegram,
            main_sport: metadata.main_sport,
            avatar_url: avatarUrl,
            avatar_data: null // clean up old base64 field
        }
    })
    
    if (error) {
        return { error: error.message }
    }
    
    return { success: true }
}