import React from 'react'
import styles from './GamesList.module.scss'
import { GameType } from '@/app/types'

type PropsType = {
    games: GameType[],
}

export const GamesList: React.FC<PropsType> = ({ }) => {

    return (
        <div className={styles.GamesList}>

        </div>
    )
}
