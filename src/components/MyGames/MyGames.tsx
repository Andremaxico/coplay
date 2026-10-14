'use client'

import React, { useState } from 'react'
import { MyGameType, MyGameRole } from '@/app/types'
import { GameCard } from '@/UI/GameCard/GameCard'
import styles from './MyGames.module.scss'
import { MyGamesTabs } from './MyGamesTabs/MyGamesTabs'

type PropsType = {
    upcoming: MyGameType[]
    past: MyGameType[]
}

type MainTab = 'upcoming' | 'past'
type RoleFilter = 'all' | MyGameRole

export const MyGames: React.FC<PropsType> = ({ upcoming, past }) => {
    const [activeTab, setActiveTab] = useState<MainTab>('upcoming')
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')

    const currentList = activeTab === 'upcoming' ? upcoming : past

    const filteredGames = currentList.filter(game => {
        if (roleFilter === 'all') return true
        if (roleFilter === 'organizer') return game.userRole === 'organizer'
        if (roleFilter === 'participant') return game.userRole === 'participant' || game.userRole === 'organizer'
        return true
    })

    const upcomingCount = upcoming.length
    const pastCount = past.length

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Мої Ігри</h1>

            {/* Main Tabs: Upcoming vs History */}
            <MyGamesTabs setActiveTab={setActiveTab} activeTab={activeTab} upcomingCount={upcomingCount} pastCount={pastCount} />

            {/* Sub-Filters: All | Created | Joined */}
            <div className={styles.filterBar}>
                <button
                    type="button"
                    className={`${styles.filterPill} ${roleFilter === 'all' ? styles.activePill : ''}`}
                    onClick={() => setRoleFilter('all')}
                >
                    Усі
                </button>
                <button
                    type="button"
                    className={`${styles.filterPill} ${roleFilter === 'organizer' ? styles.activePill : ''}`}
                    onClick={() => setRoleFilter('organizer')}
                >
                    Створені мною
                </button>
                <button
                    type="button"
                    className={`${styles.filterPill} ${roleFilter === 'participant' ? styles.activePill : ''}`}
                    onClick={() => setRoleFilter('participant')}
                >
                    Я доєднався
                </button>
            </div>

            {/* Games Grid or Empty State */}
            {filteredGames.length > 0 ? (
                <div className={styles.grid}>
                    {filteredGames.map(game => {
                        const isPastGame = activeTab === 'past' || (game.starts_at ? new Date(game.starts_at).getTime() < Date.now() : false)
                        return (
                            <div key={`${game.id}-${game.userRole}`} className={`${styles.cardWrapper} ${isPastGame ? styles.pastCardWrapper : ''}`}>
                                <div className={`${styles.roleBadge} ${game.userRole === 'organizer' ? styles.organizerBadge : styles.participantBadge} ${isPastGame ? styles.pastRoleBadge : ''}`}>
                                    {game.userRole === 'organizer'
                                        ? '👑 Ваша гра'
                                        : (isPastGame ? '✓ Ви брали участь' : '✓ Ви берете участь')}
                                </div>
                                <GameCard game={game} isInactive={isPastGame} />
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <p className={styles.emptyText}>
                        {activeTab === 'upcoming'
                            ? (roleFilter === 'organizer'
                                ? 'Ви ще не створили жодної майбутньої гри.'
                                : roleFilter === 'participant'
                                    ? 'Ви ще не доєдналися до жодної майбутньої гри.'
                                    : 'У вас немає запланованих майбутніх ігор.')
                            : (roleFilter === 'organizer'
                                ? 'В історії немає створених вами ігор.'
                                : roleFilter === 'participant'
                                    ? 'В історії немає ігор, у яких ви брали участь.'
                                    : 'Ваша історія ігор порожня.')}
                    </p>
                </div>
            )}
        </div>
    )
}
