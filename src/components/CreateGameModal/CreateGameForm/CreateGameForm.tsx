'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getExistingLocations, createGameAction } from '@/app/actions/games'
import { SportType } from '@/app/types'
import { Button } from '@/UI/Button/Button'
import { Input } from '@/UI/Input/Input'
import { Combobox } from '@/UI/Combobox/Combobox'
import { MapIcon } from '@/UI/Icons/Icons'
import { LocationMapPicker } from '../LocationMapPicker/LocationMapPicker'
import { createClient } from '@/lib/supabase/client'
import styles from './CreateGameForm.module.scss'

const sportOptions = [
    { value: 'football', label: 'Футбол' },
    { value: 'basketball', label: 'Баскетбол' },
    { value: 'volleyball', label: 'Волейбол' },
    { value: 'tennis', label: 'Теніс' },
    { value: 'other', label: 'Інше' },
]

const getSuggestedTitle = (sport: SportType) => {
    switch (sport) {
        case 'football':
            return 'Футбол'
        case 'basketball':
            return 'Баскетбол'
        case 'volleyball':
            return 'Волейбол'
        case 'tennis':
            return 'Теніс'
        default:
            return 'Спортивна гра'
    }
}

const createGameSchema = z
    .object({
        sport_type: z.enum(['football', 'basketball', 'volleyball', 'tennis', 'other'], {
            message: 'Оберіть вид спорту',
        }),
        title: z.string().trim().min(1, 'Введіть назву гри'),
        location_text: z.string().trim().min(1, 'Вкажіть місце проведення гри'),
        starts_at: z
            .string()
            .min(1, 'Вкажіть дату та час початку')
            .refine(
                (val) => {
                    const date = new Date(val)
                    return !isNaN(date.getTime()) && date.getTime() >= Date.now() - 60000
                },
                { message: 'Час початку гри не може бути в минулому' }
            ),
        max_participants: z.number().min(2, 'Кількість гравців має бути не менше 2'),
        is_public: z.boolean(),
        contact_telegram: z.string().trim().optional(),
        contact_phone: z.string().trim().optional(),
    })
    .superRefine((data, ctx) => {
        const hasTg = Boolean(data.contact_telegram && data.contact_telegram.trim().length > 0)
        const hasPhone = Boolean(data.contact_phone && data.contact_phone.trim().length > 0)
        if (!hasTg && !hasPhone) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Вкажіть хоча б один спосіб зв'язку (Telegram або Телефон/WhatsApp)",
                path: ['contact_telegram'],
            })
        }
    })

export type CreateGameFormValues = z.infer<typeof createGameSchema>

type PropsType = {
    onSuccess?: () => void
    onCancel?: () => void
}

export const CreateGameForm: React.FC<PropsType> = ({ onSuccess }) => {
    const router = useRouter()

    const [locations, setLocations] = useState<string[]>([])
    const [isMapOpen, setIsMapOpen] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const [serverSuccess, setServerSuccess] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting, dirtyFields },
    } = useForm<CreateGameFormValues>({
        resolver: zodResolver(createGameSchema),
        defaultValues: {
            sport_type: 'football',
            title: 'Футбол',
            location_text: '',
            starts_at: '',
            max_participants: 10,
            is_public: true,
            contact_telegram: '',
            contact_phone: '',
        },
    })

    const selectedSport = watch('sport_type')

    // Prefill contacts from organizer profile or session
    useEffect(() => {
        let isMounted = true
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user || !isMounted) return

            const meta = user.user_metadata || {}
            if (meta.telegram) setValue('contact_telegram', meta.telegram)
            if (meta.phone) setValue('contact_phone', meta.phone)

            supabase
                .from('profiles')
                .select('telegram, phone')
                .eq('id', user.id)
                .maybeSingle()
                .then(({ data }) => {
                    if (data && isMounted) {
                        if (data.telegram) setValue('contact_telegram', data.telegram)
                        if (data.phone) setValue('contact_phone', data.phone)
                    }
                })
        })
        return () => {
            isMounted = false
        }
    }, [setValue])

    // Fetch existing locations for Combobox autocomplete options
    useEffect(() => {
        let isMounted = true
        getExistingLocations()
            .then((locs) => {
                if (isMounted) {
                    setLocations(locs)
                }
            })
            .catch((err) => {
                console.error('Failed to fetch locations:', err)
            })
        return () => {
            isMounted = false
        }
    }, [])

    // Update suggested title when sport changes and user hasn't typed a custom title
    const handleSportChange = (sport: SportType) => {
        setValue('sport_type', sport, { shouldValidate: true })
        if (!dirtyFields.title) {
            setValue('title', getSuggestedTitle(sport), { shouldValidate: true })
        }
    }

    const onSubmit = async (data: CreateGameFormValues) => {
        setServerError(null)
        setServerSuccess(null)

        try {
            const res = await createGameAction(data)
            if (res?.error) {
                setServerError(res.error)
            } else {
                setServerSuccess('Гру успішно створено!')
                router.refresh()
                setTimeout(() => {
                    reset()
                    setIsMapOpen(false)
                    onSuccess?.()
                }, 1200)
            }
        } catch {
            setServerError('Виникла помилка при створенні гри')
        }
    }

    const locationOptions = locations.map((loc) => ({ value: loc, label: loc }))

    return (
        <form noValidate onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {serverError && <div className={styles.errorAlert}>{serverError}</div>}
            {serverSuccess && <div className={styles.successAlert}>{serverSuccess}</div>}

            {/* Sport Type */}
            <Controller
                name="sport_type"
                control={control}
                render={({ field }) => (
                    <Combobox
                        label="Вид спорту"
                        value={field.value}
                        onChange={(val) => {
                            if (val) {
                                handleSportChange(val as SportType)
                            }
                        }}
                        options={sportOptions}
                        error={errors.sport_type?.message}
                        required
                    />
                )}
            />

            {/* Title */}
            <Input
                label="Назва гри"
                type="text"
                placeholder="Наприклад: Вечірній футбол"
                error={errors.title?.message}
                required
                {...register('title')}
            />

            {/* Location with Google Maps picker */}
            <div className={styles.locationContainer}>
                <div className={styles.locationInputRow}>
                    <div className={styles.comboboxWrapper}>
                        <Controller
                            name="location_text"
                            control={control}
                            render={({ field }) => (
                                <Combobox
                                    label="Місце проведення"
                                    value={field.value}
                                    onChange={(val) => field.onChange(val || '')}
                                    options={locationOptions}
                                    placeholder="Оберіть місце або введіть нове..."
                                    error={errors.location_text?.message}
                                    required
                                />
                            )}
                        />
                    </div>
                    <button
                        type="button"
                        className={`${styles.mapToggleBtn} ${isMapOpen ? styles.mapToggleActive : ''}`}
                        onClick={() => setIsMapOpen((prev) => !prev)}
                        title="Обрати на карті Google"
                    >
                        <MapIcon />
                        <span>{isMapOpen ? 'Сховати' : 'На карті'}</span>
                    </button>
                </div>

                {isMapOpen && (
                    <LocationMapPicker
                        initialLocation={watch('location_text')}
                        onSelectLocation={(loc) => {
                            setValue('location_text', loc, {
                                shouldValidate: true,
                                shouldDirty: true,
                            })
                        }}
                        onClose={() => setIsMapOpen(false)}
                    />
                )}
            </div>

            {/* Time & Players count */}
            <div className={styles.row}>
                <Input
                    label="Час початку"
                    type="datetime-local"
                    error={errors.starts_at?.message}
                    required
                    {...register('starts_at')}
                />
                <Input
                    label="Кількість гравців"
                    type="number"
                    min="2"
                    error={errors.max_participants?.message}
                    required
                    {...register('max_participants', { valueAsNumber: true })}
                />
            </div>

            {/* Organizer Contacts (At least 1 required) */}
            <div className={styles.contactsSection}>
                <div className={styles.contactsHeader}>
                    <span className={styles.contactsTitle}>
                        Контакти організатора <span className={styles.requiredMark}>*</span>
                    </span>
                    <span className={styles.contactsSubtitle}>
                        Вкажіть щонайменше 1 спосіб зв&apos;язку для координації гри
                    </span>
                </div>

                {errors.contact_telegram && !errors.contact_telegram.message?.includes('Введіть') && (
                    <div className={styles.contactGlobalError}>
                        {errors.contact_telegram.message}
                    </div>
                )}

                <div className={styles.row}>
                    <Input
                        label="Telegram"
                        type="text"
                        placeholder="@username"
                        error={errors.contact_telegram?.message}
                        {...register('contact_telegram')}
                    />
                    <Input
                        label="Телефон / WhatsApp"
                        type="tel"
                        placeholder="+380991234567"
                        error={errors.contact_phone?.message}
                        {...register('contact_phone')}
                    />
                </div>
            </div>

            {/* Public checkbox */}
            <label className={styles.checkboxField}>
                <input
                    type="checkbox"
                    className={styles.checkbox}
                    {...register('is_public')}
                />
                <span>Публічна гра (видно всім)</span>
            </label>

            {/* Submit button */}
            <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className={styles.submitBtn}
            >
                {isSubmitting ? 'Створення...' : 'Створити'}
            </Button>
        </form>
    )
}