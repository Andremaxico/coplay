'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { getExistingLocations, createGameAction } from '@/app/actions/games'
import { SportType } from '@/app/types'
import { Button } from '@/UI/Button/Button'
import { Input } from '@/UI/Input/Input'
import { Combobox } from '@/UI/Combobox/Combobox'
import { CloseIcon } from '@/UI/Icons/Icons'
import styles from './CreateGameModal.module.scss'

type PropsType = {
    isOpen: boolean
    onClose: () => void
}

const sportOptions = [
    { value: 'football', label: 'Футбол' },
    { value: 'basketball', label: 'Баскетбол' },
    { value: 'volleyball', label: 'Волейбол' },
    { value: 'tennis', label: 'Теніс' },
    { value: 'other', label: 'Інше' }
]

export const CreateGameModal: React.FC<PropsType> = ({ isOpen, onClose }) => {
    const router = useRouter()

    // Form fields
    const [sportType, setSportType] = useState<SportType | undefined>(undefined)
    const [title, setTitle] = useState<string | undefined>(undefined)
    const [isTitleDirty, setIsTitleDirty] = useState(false)
    const [selectedLocation, setSelectedLocation] = useState<string | undefined>(undefined)
    const [startsAt, setStartsAt] = useState<string | undefined>(undefined)
    const [maxParticipants, setMaxParticipants] = useState<number | undefined>(undefined)
    const [isPublic, setIsPublic] = useState(true)

    // DB locations
    const [locations, setLocations] = useState<string[]>([])

    // Status
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const getSuggestedTitle = (sport: SportType, loc: string) => {
        const sportName = sport === 'football' ? 'Футбол' :
            sport === 'basketball' ? 'Баскетбол' :
                sport === 'volleyball' ? 'Волейбол' :
                    sport === 'tennis' ? 'Теніс' : 'Спортивна гра';
        const locSuffix = loc ? ` (на ${loc})` : '';
        return `${sportName}${locSuffix}`;
    }

    const handleSportChange = (val: SportType) => {
        setSportType(val)
        if (!isTitleDirty) {
            setTitle(getSuggestedTitle(val, selectedLocation || ''))
        }
    }

    const handleLocationChange = (val: string | undefined) => {
        setSelectedLocation(val)
        if (!isTitleDirty && sportType) {
            setTitle(getSuggestedTitle(sportType, val || ''))
        }
    }

    // Fetch existing locations when the modal opens
    useEffect(() => {
        if (isOpen) {
            getExistingLocations().then(locs => {
                setLocations(locs)
                if (locs.length > 0) {
                    setSelectedLocation(locs[0])
                    if (!isTitleDirty && sportType) {
                        setTitle(getSuggestedTitle(sportType, locs[0]))
                    }
                } else {
                    setSelectedLocation('')
                    if (!isTitleDirty && sportType) {
                        setTitle(getSuggestedTitle(sportType, ''))
                    }
                }
            }).catch(err => {
                console.error('Failed to fetch locations:', err)
                setSelectedLocation('')
                if (!isTitleDirty && sportType) {
                    setTitle(getSuggestedTitle(sportType, ''))
                }
            })
        }
    }, [isOpen, isTitleDirty, sportType])

    if (!isOpen) return null

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)
        setLoading(true)

        const finalLocation = selectedLocation?.trim()

        if (!finalLocation) {
            setError('Будь ласка, вкажіть місце проведення гри')
            setLoading(false)
            return
        }
        if (!title || !sportType || !startsAt || !maxParticipants) {
            setError('Будь ласка, вкажіть усі необхідні дані')
            setLoading(false)
            return
        }

        try {
            const res = await createGameAction({
                sport_type: sportType,
                title: title.trim(),
                location_text: finalLocation,
                starts_at: startsAt,
                max_participants: Number(maxParticipants),
                is_public: isPublic
            })

            if (res?.error) {
                setError(res.error)
            } else {
                setSuccess('Гру успішно створено!')
                router.refresh()
                setTimeout(() => {
                    onClose()
                    // Reset fields
                    setSportType('football')
                    setTitle('Футбол')
                    setIsTitleDirty(false)
                    setSelectedLocation('')
                    setStartsAt('')
                    setMaxParticipants(10)
                    setIsPublic(true)
                    setSuccess(null)
                }, 1500)
            }
        } catch {
            setError('Виникла помилка при створенні гри')
        } finally {
            setLoading(false)
        }
    }

    const locationOptions = locations.map(loc => ({ value: loc, label: loc }))

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <CloseIcon />
                </button>

                <h2 className={styles.modalTitle}>Створити гру</h2>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.errorAlert}>{error}</div>}
                    {success && <div className={styles.successAlert}>{success}</div>}

                    <Combobox
                        label="Вид спорту"
                        value={sportType}
                        onChange={(val) => handleSportChange(val as SportType)}
                        options={sportOptions}
                        required
                    />

                    <Input
                        label="Назва гри"
                        type="text"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value)
                            setIsTitleDirty(true)
                        }}
                        placeholder="Наприклад: Вечірній футбол"
                        required
                    />

                    <Combobox
                        label="Місце проведення"
                        value={selectedLocation}
                        onChange={handleLocationChange}
                        options={locationOptions}
                        placeholder="Оберіть місце або введіть нове..."
                        required
                    />

                    <div className={styles.row}>
                        <Input
                            label="Час початку"
                            type="datetime-local"
                            value={startsAt}
                            onChange={(e) => setStartsAt(e.target.value)}
                            required
                        />
                        <Input
                            label="Кількість гравців"
                            type="number"
                            value={maxParticipants}
                            onChange={(e) => setMaxParticipants(Number(e.target.value))}
                            min="2"
                            required
                        />
                    </div>

                    <label className={styles.checkboxField}>
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className={styles.checkbox}
                        />
                        <span>Публічна гра (видно всім)</span>
                    </label>

                    <Button type="submit" variant="secondary" disabled={loading} className={styles.submitBtn}>
                        {loading ? 'Створення...' : 'Створити'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
