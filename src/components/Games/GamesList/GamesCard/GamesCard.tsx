import React from 'react'
import styles from './GamesCard.module.scss'
import { GameType } from '@/app/types'

type PropsType = {
    game: GameType,
}

export const GamesCard: React.FC<PropsType> = ({ game }) => {
    return (
        <div className={styles.card}>
            <h4 className={styles.title}>{game.title}</h4>
        </div>
    )
}
