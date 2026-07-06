import React from 'react'
import styles from './GamesTitle.module.scss'

export const GamesTitle = () => {
    const geo = "Poznań"

    return (
        <h2 className={styles.title}>Найближчі ігри у {geo}</h2>
    )
}
