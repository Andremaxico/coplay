'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { GameType, MyGameType, OrganizerType, SportType } from '../types'

export type GameModel = Omit<GameType, 'id' | 'created_at' | 'current_participants' | 'organizer'>;

export const createGame = async (formData: FormData) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const gameData: GameModel = {
        organizer_id: user.id,
        sport: (formData.get('sport_type') as SportType) || 'football',
        title: String(formData.get('title') || ''),
        location_text: String(formData.get('location_text') || ''),
        starts_at: String(formData.get('starts_at') || ''),
        max_participants: Number(formData.get('max_participants')),
        is_public: formData.get('is_public') === 'true',
    }

    const { data: createdGame, error } = await supabase.from('games').insert(gameData).select('id').single()

    if (error) throw new Error('Помилка створення гри')

    if (createdGame?.id) {
        await supabase.from('game_participants').insert({
            game_id: createdGame.id,
            user_id: user.id,
        })
    }

    revalidatePath('/') // Оновлюємо кеш стрічки
    revalidatePath('/my-games')
}

export const joinGameAction = async (gameId: string) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Авторизуйтесь, щоб приєднатись' }

    // Викликаємо нашу RPC функцію з Кроку 1
    const { data, error } = await supabase.rpc('join_game', {
        p_game_id: gameId,
        p_user_id: user.id
    })

    if (error) {
        console.error('joinGameAction error:', error)
        return { error: 'Виникла помилка при приєднанні до гри' }
    }

    if (!data) return { error: 'На жаль, вільних місць вже немає' }

    revalidatePath(`/games/${gameId}`)
    revalidatePath('/')
    revalidatePath('/my-games')
}

export const getGames = async () => {
    const supabase = await createClient()

    const nowIso = new Date().toISOString()

    const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .gte('starts_at', nowIso)
        .order('starts_at', { ascending: true })
        .limit(50)

    if (error) {
        console.error('Error fetching games:', error)
        return { error: error.message }
    }

    if (!games || games.length === 0) return []

    // Ensure double-check in JS so any passed game is excluded from the main feed
    const nowTime = Date.now()
    const activeGames = games.filter(g => {
        if (!g.starts_at) return false
        return new Date(g.starts_at).getTime() >= nowTime
    })

    if (activeGames.length === 0) return []

    // Fetch organizer profiles using organizer_id
    const organizerIds = Array.from(new Set(activeGames.map(g => g.organizer_id).filter(Boolean)))

    const profilesMap: Record<string, OrganizerType> = {}

    if (organizerIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, telegram, phone')
            .in('id', organizerIds)

        if (profiles) {
            profiles.forEach(p => {
                profilesMap[p.id] = {
                    first_name: p.first_name,
                    last_name: p.last_name,
                    avatar_url: p.avatar_url,
                    telegram: p.telegram,
                    phone: p.phone,
                }
            })
        }
    }

    const gamesWithOrganizers = activeGames.map(game => ({
        ...game,
        organizer: profilesMap[game.organizer_id] || undefined
    }))

    return gamesWithOrganizers as unknown as GameType[]
}

export const getExistingLocations = async (): Promise<string[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('games')
        .select('location_text')

    if (error) {
        console.error('Error fetching locations:', error)
        return []
    }

    const locations = data
        .map(g => g.location_text)
        .filter((loc): loc is string => typeof loc === 'string' && loc.trim() !== '')

    return Array.from(new Set(locations))
}

export const createGameAction = async (data: {
    sport_type: SportType
    title: string
    location_text: string
    starts_at: string
    max_participants: number
    is_public?: boolean
    contact_telegram?: string
    contact_phone?: string
}) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Неавторизовано' }
    }

    // Require at least one contact method
    const tg = data.contact_telegram?.trim() || ''
    const ph = data.contact_phone?.trim() || ''

    if (!tg && !ph) {
        return { error: "Будь ласка, вкажіть хоча б один спосіб зв'язку (Telegram або Телефон/WhatsApp)" }
    }

    const { data: createdGame, error } = await supabase.from('games').insert<GameModel>({
        organizer_id: user.id,
        sport: data.sport_type,
        title: data.title,
        location_text: data.location_text,
        starts_at: data.starts_at,
        max_participants: data.max_participants,
        is_public: data.is_public ?? true,
    }).select('id').single()

    if (error) {
        console.error('Error creating game:', error)
        return { error: error.message }
    }

    if (createdGame?.id) {
        const { error: partError } = await supabase
            .from('game_participants')
            .insert({
                game_id: createdGame.id,
                user_id: user.id,
            })

        if (partError) {
            console.error('Error adding creator to game_participants:', partError)
        }
    }

    // Synchronize contacts with organizer profile
    try {
        const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
        }
        if (tg) updates.telegram = tg
        if (ph) updates.phone = ph

        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle()

        if (existingProfile) {
            await supabase.from('profiles').update(updates).eq('id', user.id)
        } else {
            await supabase.from('profiles').insert({
                id: user.id,
                first_name: user.user_metadata?.first_name || 'Організатор',
                last_name: user.user_metadata?.last_name || null,
                avatar_url: user.user_metadata?.avatar_url || null,
                telegram: tg || null,
                phone: ph || null,
                updated_at: new Date().toISOString(),
            })
        }

        // Also update auth user metadata
        await supabase.auth.updateUser({
            data: {
                ...user.user_metadata,
                ...(tg && { telegram: tg }),
                ...(ph && { phone: ph }),
            }
        })
    } catch (profileErr) {
        console.error('Error updating organizer profile contacts:', profileErr)
    }

    revalidatePath('/')
    revalidatePath('/my-games')
    return { success: true }
}

export const getMyGames = async (): Promise<{ upcoming: MyGameType[]; past: MyGameType[] }> => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { upcoming: [], past: [] }

    // Fetch games organized by user
    const { data: organizedGames, error: organizedError } = await supabase
        .from('games')
        .select('*')
        .eq('organizer_id', user.id)

    if (organizedError) {
        console.error('Error fetching organized games:', organizedError)
    }

    // Fetch games joined by user from game_participants table
    let joinedGameIds: string[] = []
    const { data: participants, error: participantsError } = await supabase
        .from('game_participants')
        .select('game_id')
        .eq('user_id', user.id)

    if (!participantsError && participants) {
        joinedGameIds = participants.map(p => p.game_id).filter((id): id is string => Boolean(id))
    }

    let joinedGames: any[] = []
    const nonOrganizedJoinedIds = joinedGameIds.filter(id => !(organizedGames || []).some(og => og.id === id))

    if (nonOrganizedJoinedIds.length > 0) {
        const { data: jGames, error: jError } = await supabase
            .from('games')
            .select('*')
            .in('id', nonOrganizedJoinedIds)

        if (!jError && jGames) {
            joinedGames = jGames
        }
    }

    const myGames: MyGameType[] = [
        ...(organizedGames || []).map(g => ({ ...g, userRole: 'organizer' as const })),
        ...(joinedGames || []).map(g => ({ ...g, userRole: 'participant' as const }))
    ]

    const organizerIds = Array.from(new Set(myGames.map(g => g.organizer_id).filter(Boolean)))
    const profilesMap: Record<string, OrganizerType> = {}

    if (organizerIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, telegram, phone')
            .in('id', organizerIds)

        if (profiles) {
            profiles.forEach(p => {
                profilesMap[p.id] = {
                    first_name: p.first_name,
                    last_name: p.last_name,
                    avatar_url: p.avatar_url,
                    telegram: p.telegram,
                    phone: p.phone,
                }
            })
        }
    }

    const now = new Date()

    const enrichedGames = myGames.map(game => ({
        ...game,
        organizer: profilesMap[game.organizer_id] || undefined
    }))

    const upcoming = enrichedGames
        .filter(g => new Date(g.starts_at) >= now)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

    const past = enrichedGames
        .filter(g => new Date(g.starts_at) < now)
        .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())

    return { upcoming, past }
}