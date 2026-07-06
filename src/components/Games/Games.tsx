import React from 'react'
import { GamesTitle } from './GamesTitle/GamesTitle'
import { getGames } from '@/app/actions/games'
import { GamesList } from './GamesList/GamesList';

export const Games = async () => {
    const gamesData = await getGames()
    const games = Array.isArray(gamesData) ? gamesData : []

    return (
        <div>
            <GamesTitle />
            <GamesList games={games} />
        </div>
    )
}
