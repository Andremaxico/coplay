import React from 'react'
import { GameType } from '@/app/types'
import { GameCard } from '@/UI/GameCard/GameCard'

type PropsType = {
    game: GameType
}

export const GamesCard: React.FC<PropsType> = ({ game }) => {
    return <GameCard game={game} />
}
