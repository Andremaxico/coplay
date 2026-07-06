import React from 'react'
import styles from './GameCard.module.scss'

import { GameType } from '@/app/types'

type PropsType = {
    game: GameType
}

export const GameCard: React.FC<PropsType> = ({ game }) => {
    return (
        <div className={styles.GameCard}>
            <h3>{game.title}</h3>
        </div>
    )
}
