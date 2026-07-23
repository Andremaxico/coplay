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

    // Field errors state
    const [fieldErrors, setFieldErrors] = useState<{
        sportType?: string
        title?: string
        selectedLocation?: string
        startsAt?: string
        maxParticipants?: string
    }>({})

    if (!isOpen) return null

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)
        
        const errors: typeof fieldErrors = {}

        if (!sportType) {
            errors.sportType = "Оберіть вид спорту"
        }
        if (!title || !title.trim()) {
            errors.title = "Введіть назву гри"
        }
        const finalLocation = selectedLocation?.trim()
        if (!finalLocation) {
            errors.selectedLocation = "Вкажіть місце проведення гри"
        }
        if (!startsAt) {
            errors.startsAt = "Вкажіть дату та час початку"
        } else if (new Date(startsAt).getTime() < Date.now() - 60000) {
            errors.startsAt = "Час початку гри не може бути в минулому"
        }
        if (!maxParticipants || Number(maxParticipants) < 2) {
            errors.maxParticipants = "Кількість гравців має бути не менше 2"
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }

        setFieldErrors({})
        setLoading(true)

        try {
            const res = await createGameAction({
                sport_type: sportType!,
                title: title!.trim(),
                location_text: finalLocation!,
                starts_at: startsAt!,
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
                    setFieldErrors({})
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

                <form noValidate onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.errorAlert}>{error}</div>}
                    {success && <div className={styles.successAlert}>{success}</div>}

                    <Combobox
                        label="Вид спорту"
                        value={sportType}
                        onChange={(val) => {
                            setFieldErrors(prev => ({ ...prev, sportType: undefined }))
                            handleSportChange(val as SportType)
                        }}
                        options={sportOptions}
                        error={fieldErrors.sportType}
                        required
                    />

                    <Input
                        label="Назва гри"
                        type="text"
                        value={title || ''}
                        onChange={(e) => {
                            setTitle(e.target.value)
                            setIsTitleDirty(true)
                            setFieldErrors(prev => ({ ...prev, title: undefined }))
                        }}
                        placeholder="Наприклад: Вечірній футбол"
                        error={fieldErrors.title}
                        required
                    />

                    <Combobox
                        label="Місце проведення"
                        value={selectedLocation}
                        onChange={(val) => {
                            setFieldErrors(prev => ({ ...prev, selectedLocation: undefined }))
                            handleLocationChange(val)
                        }}
                        options={locationOptions}
                        placeholder="Оберіть місце або введіть нове..."
                        error={fieldErrors.selectedLocation}
                        required
                    />

                    <div className={styles.row}>
                        <Input
                            label="Час початку"
                            type="datetime-local"
                            value={startsAt || ''}
                            onChange={(e) => {
                                setStartsAt(e.target.value)
                                setFieldErrors(prev => ({ ...prev, startsAt: undefined }))
                            }}
                            error={fieldErrors.startsAt}
                            required
                        />
                        <Input
                            label="Кількість гравців"
                            type="number"
                            value={maxParticipants || ''}
                            onChange={(e) => {
                                setMaxParticipants(Number(e.target.value))
                                setFieldErrors(prev => ({ ...prev, maxParticipants: undefined }))
                            }}
                            min="2"
                            error={fieldErrors.maxParticipants}
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
