import React from 'react'
import { GamesTitle } from './GamesTitle/GamesTitle'
import { GamesList } from './GamesList/GamesList'
import { AddGameButton } from './AddGameButton/AddGameButton'
import styles from './Games.module.scss'

export const Games = () => {
    return (
        <div className={styles.games}>
            <GamesTitle />
            <GamesList />
            <AddGameButton />
        </div>
    )
}

