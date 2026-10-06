'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './GameCard.module.scss'
import { GameType, SportType } from '@/app/types'
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
    CheckIcon,
    TelegramIcon,
    WhatsAppIcon
} from '../Icons/Icons'
import { joinGameAction } from '@/app/actions/games'
import { useModalStore } from '@/store/useModalStore'
import { createClient } from '@/lib/supabase/client'

type PropsType = {
    game: GameType
    isInactive?: boolean
}

const getSportIcon = (sport: SportType) => {
    console.log('sport', sport)
    if (!sport) return <SportGenericIcon />
    const normalized = sport.toLowerCase().trim()
    switch (normalized) {
        case 'football':
            return <FootballIcon />
        case 'basketball':
            return <BasketballIcon />
        case 'volleyball':
            return <VolleyballIcon />
        case 'tennis':
            return <TennisIcon />
        default:
            return <SportGenericIcon />
    }
}

const formatDateTime = (dateStr: string) => {
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

const getCleanTelegram = (tg?: string) => {
    if (!tg) return null
    let handle = tg.trim()
    if (handle.startsWith('https://t.me/')) {
        handle = handle.replace('https://t.me/', '')
    } else if (handle.startsWith('t.me/')) {
        handle = handle.replace('t.me/', '')
    }
    if (handle.startsWith('@')) {
        handle = handle.slice(1)
    }
    return handle.trim() || null
}

const getCleanPhoneForWhatsApp = (phone?: string) => {
    if (!phone) return null
    const digits = phone.replace(/[^\d]/g, '')
    return digits.length >= 9 ? digits : null
}

export const GameCard: React.FC<PropsType> = ({ game, isInactive }) => {
    const router = useRouter()
    const openLogin = useModalStore((state) => state.openLogin)

    const [loading, setLoading] = useState(false)
    const [hasJoined, setHasJoined] = useState(false)
    const [organizerProfile, setOrganizerProfile] = useState(game.organizer)

    console.log('game data', game)

    const {
        id,
        title,
        sport,
        location_text,
        starts_at,
        max_participants,
        current_participants = 1,
        organizer_id
    } = game

    const isPast = isInactive !== undefined
        ? isInactive
        : (starts_at ? new Date(starts_at).getTime() < Date.now() : false)

    useEffect(() => {
        const supabase = createClient()

        if (!organizerProfile && organizer_id) {
            supabase
                .from('profiles')
                .select('first_name, last_name, avatar_url, telegram, phone')
                .eq('id', organizer_id)
                .maybeSingle()
                .then(({ data }) => {
                    if (data) {
                        setOrganizerProfile(data)
                    }
                })
        }

        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                if (user.id === organizer_id) {
                    setHasJoined(true)
                } else {
                    supabase
                        .from('game_participants')
                        .select('id')
                        .eq('game_id', id)
                        .eq('user_id', user.id)
                        .maybeSingle()
                        .then(({ data }) => {
                            if (data) setHasJoined(true)
                        })
                }
            }
        })
    }, [id, organizer_id, organizerProfile])

    const currentCount = current_participants || 1
    const isFull = currentCount >= max_participants

    const handleJoin = async () => {
        if (isPast || hasJoined || isFull || loading) return

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
    const telegramHandle = getCleanTelegram(organizerProfile?.telegram)
    const whatsappNumber = getCleanPhoneForWhatsApp(organizerProfile?.phone)
    const percent = Math.min(100, Math.round((currentCount / max_participants) * 100))

    return (
        <div className={`${styles.GameCard} ${isPast ? styles.inactive : ''}`}>
            <div className={styles.header}>
                <div className={styles.sportsIcon}>
                    {getSportIcon(sport)}
                </div>
                <h3>{title}</h3>
            </div>

            {/* Організатор: фото, ім'я та контактна інформація */}
            <div className={styles.organizator_info}>
                <div className={styles.organizerProfile}>
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

                {(telegramHandle || whatsappNumber) && (
                    <div className={styles.contacts}>
                        {telegramHandle && (
                            <a
                                href={`https://t.me/${telegramHandle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.telegramLink}
                                title={`Написати в Telegram: @${telegramHandle}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <TelegramIcon />
                                <span>@{telegramHandle}</span>
                            </a>
                        )}
                        {whatsappNumber && (
                            <a
                                href={`https://wa.me/${whatsappNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.whatsappLink}
                                title={`Написати у WhatsApp: ${organizerProfile?.phone || whatsappNumber}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <WhatsAppIcon />
                                <span>WhatsApp</span>
                            </a>
                        )}
                    </div>
                )}
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
                        disabled={loading || isPast || (isFull && !hasJoined)}
                        className={`${styles.participate_btn} ${isPast ? styles.past : ''} ${hasJoined && !isPast ? styles.joined : ''} ${isFull && !hasJoined && !isPast ? styles.full : ''}`}
                    >
                        {loading ? (
                            'Обробка...'
                        ) : isPast ? (
                            'Завершено'
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
