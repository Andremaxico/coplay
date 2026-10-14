import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyGames } from '@/app/actions/games'
import { MyGames } from '@/components/MyGames/MyGames'

export const metadata = {
    title: 'Мої Ігри | CoPlay',
    description: 'Перегляд вашої історії та майбутніх ігор на CoPlay',
}

const MyGamesPage = async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    const { upcoming, past } = await getMyGames()

    return <MyGames upcoming={upcoming} past={past} />
}

export default MyGamesPage
