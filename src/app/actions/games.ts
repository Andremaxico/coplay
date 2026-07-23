'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { GameType, SportType } from '../types'

export type GameModel = Omit<GameType, 'id' | 'created_at'>;

export async function createGame(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const gameData = {
        organizer_id: user.id,
        sport_type: formData.get('sport_type'),
        title: formData.get('title'),
        location_text: formData.get('location_text'), // Поки без Google Places, просто текст (напр. "Орлик на Ратаях")
        starts_at: formData.get('starts_at'),
        max_participants: Number(formData.get('max_participants')),
        is_public: formData.get('is_public') === 'true',
    }

    const { error } = await supabase.from('games').insert(gameData)

    if (error) throw new Error('Помилка створення гри')

    revalidatePath('/') // Оновлюємо кеш стрічки
}

export async function joinGameAction(gameId: string) {
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
}

export const getGames = async () => {
    const supabase = await createClient()

    const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .order('starts_at', { ascending: true })
        .limit(20)

    if (error) {
        console.error('Error fetching games:', error)
        return { error: error.message }
    }

    if (!games || games.length === 0) return []

    // Fetch organizer profiles using organizer_id
    const organizerIds = Array.from(new Set(games.map(g => g.organizer_id).filter(Boolean)))

    const profilesMap: Record<string, { first_name?: string; avatar_url?: string }> = {}

    if (organizerIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, avatar_url')
            .in('id', organizerIds)

        if (profiles) {
            profiles.forEach(p => {
                profilesMap[p.id] = {
                    first_name: p.first_name,
                    avatar_url: p.avatar_url
                }
            })
        }
    }

    const gamesWithOrganizers = games.map(game => ({
        ...game,
        organizer: profilesMap[game.organizer_id] || undefined
    }))

    return gamesWithOrganizers as unknown as GameType[]
}

export async function getExistingLocations(): Promise<string[]> {
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

export async function createGameAction(data: {
    sport_type: SportType
    title: string
    location_text: string
    starts_at: string
    max_participants: number
    is_public?: boolean
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Неавторизовано' }
    }

    const { error } = await supabase.from('games').insert<GameModel>({
        organizer_id: user.id,
        sport_type: data.sport_type,
        title: data.title,
        location_text: data.location_text,
        starts_at: data.starts_at,
        max_participants: data.max_participants,
        is_public: data.is_public ?? true,
        current_participants: 1,
    })

    if (error) {
        console.error('Error creating game:', error)
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}