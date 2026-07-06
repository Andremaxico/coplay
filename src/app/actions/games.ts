'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { GameType } from '../types'

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
        .limit(10)

    if (error) {
        console.error('Error fetching games:', error, error.message)
        return { error: error.message }
    }

    return games || [] as GameType[]
}