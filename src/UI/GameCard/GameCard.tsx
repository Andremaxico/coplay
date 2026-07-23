'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './GameCard.module.scss'
import { GameType } from '@/app/types'
import { Button } from '../Button/Button'
import {
    FootballIcon,
    BasketballIcon,
    VolleyballIcon,
    TennisIcon,
    SportGenericIcon,
    LocationIcon,
    ClockIcon,
    UsersIcon,
    ProfileIcon,
    CheckIcon
} from '../Icons/Icons'
import { joinGameAction } from '@/app/actions/games'
import { useModalStore } from '@/store/useModalStore'
import { createClient } from '@/lib/supabase/client'

type PropsType = {
    game: GameType
}

function getSportIcon(sport: string) {
    switch (sport) {
        case 'football': return <FootballIcon />
        case 'basketball': return <BasketballIcon />
        case 'volleyball': return <VolleyballIcon />
        case 'tennis': return <TennisIcon />
        default: return <SportGenericIcon />
    }
}

function formatDateTime(dateStr: string) {
    if (!dateStr) return ''
    try {
        const date = new Date(dateStr)
        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()

        const time = new Intl.DateTimeFormat('uk-UA', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)

        if (isToday) {
            return `Сьогодні о ${time}`
        }

        return new Intl.DateTimeFormat('uk-UA', {
            day: 'numeric',
            month: 'short',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    } catch {
        return dateStr
    }
}

export const GameCard: React.FC<PropsType> = ({ game }) => {
    const router = useRouter()
    const openLogin = useModalStore((state) => state.openLogin)

    const [loading, setLoading] = useState(false)
    const [hasJoined, setHasJoined] = useState(false)
    const [organizerProfile, setOrganizerProfile] = useState(game.organizer)

    const {
        id,
        title,
        sport_type,
        location_text,
        starts_at,
        max_participants,
        current_participants = 1,
        organizer_id
    } = game

    useEffect(() => {
        if (!organizerProfile && organizer_id) {
            const supabase = createClient()
            supabase
                .from('profiles')
                .select('first_name, avatar_url')
                .eq('id', organizer_id)
                .maybeSingle()
                .then(({ data }) => {
                    if (data) {
                        setOrganizerProfile(data)
                    }
                })
        }
    }, [organizer_id, organizerProfile])

    const currentCount = hasJoined ? (current_participants || 1) + 1 : (current_participants || 1)
    const isFull = currentCount >= max_participants

    const handleJoin = async () => {
        if (hasJoined || isFull || loading) return

        setLoading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                openLogin()
                setLoading(false)
                return
            }

            const res = await joinGameAction(id)
            if (res?.error) {
                alert(res.error)
            } else {
                setHasJoined(true)
                router.refresh()
            }
        } catch {
            alert('Помилка при приєднанні до гри')
        } finally {
            setLoading(false)
        }
    }

    const organizerName = organizerProfile?.first_name || 'Організатор'
    const organizerAvatar = organizerProfile?.avatar_url
    const percent = Math.min(100, Math.round((currentCount / max_participants) * 100))

    return (
        <div className={styles.GameCard}>
            <div className={styles.header}>
                <div className={styles.sportsIcon}>
                    {getSportIcon(sport_type)}
                </div>
                <h3>{title}</h3>
            </div>

            {/* Про організатора тільки фото і ім'я */}
            <div className={styles.organizator_info}>
                {organizerAvatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={organizerAvatar}
                        alt={organizerName}
                        className={styles.avatar}
                    />
                ) : (
                    <div className={styles.avatarFallback}>
                        <ProfileIcon />
                    </div>
                )}
                <span className={styles.name}>{organizerName}</span>
            </div>

            <div className={styles.info}>
                <p className={styles.location}>
                    <LocationIcon /> {location_text}
                </p>
                <p className={styles.time}>
                    <ClockIcon /> {formatDateTime(starts_at)}
                </p>

                {/* Прогресбар та кнопка в одному рядку */}
                <div className={styles.actionRow}>
                    <div className={styles.progressContainer}>
                        <div className={styles.progressText}>
                            <UsersIcon /> {currentCount} / {max_participants}
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleJoin}
                        disabled={loading || (isFull && !hasJoined)}
                        className={`${styles.participate_btn} ${hasJoined ? styles.joined : ''} ${isFull && !hasJoined ? styles.full : ''}`}
                    >
                        {loading ? (
                            'Обробка...'
                        ) : hasJoined ? (
                            <>
                                <CheckIcon /> У грі
                            </>
                        ) : isFull ? (
                            'Немає місць'
                        ) : (
                            'Взяти участь'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
