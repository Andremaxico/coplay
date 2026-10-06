'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateProfileMetadata } from '@/app/actions/auth'
import { SportType, UserType } from '@/app/types'
import { Button } from '@/UI/Button/Button'
import { Input } from '@/UI/Input/Input'
import { Select } from '@/UI/Select/Select'
import { CloseIcon } from '@/UI/Icons/Icons'
import { useAvatarCrop } from '@/app/hooks'
import styles from './ProfileEditModal.module.scss'

const profileEditSchema = z.object({
    first_name: z.string().trim().min(1, "Введіть ім'я"),
    last_name: z.string().trim().min(1, "Введіть прізвище"),
    phone: z.string().trim().min(1, "Введіть номер телефону"),
    telegram: z.string().trim().optional(),
    main_sport: z.enum(['football', 'basketball', 'volleyball', 'tennis', 'other']),
})

type ProfileEditFormValues = z.infer<typeof profileEditSchema>

type PropsType = {
    user: UserType | null
    isOpen: boolean
    onClose: () => void
}

export const ProfileEditModal: React.FC<PropsType> = ({ user, isOpen, onClose }) => {
    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ProfileEditFormValues>({
        resolver: zodResolver(profileEditSchema),
        defaultValues: {
            first_name: user?.user_metadata?.first_name || '',
            last_name: user?.user_metadata?.last_name || '',
            phone: user?.user_metadata?.phone || '',
            telegram: user?.user_metadata?.telegram || '',
            main_sport: (user?.user_metadata?.main_sport as SportType) || 'football',
        },
    })

    // Custom hook encapsulating image cropping, drag & zoom mechanics
    const {
        imageSrc,
        zoom,
        xOffset,
        yOffset,
        isDragging,
        fileInputRef,
        handleFileChange,
        triggerFileSelect,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        handleMouseDown,
        handleMouseMove,
        handleMouseUpOrLeave,
        handleWheel,
        cropImage,
    } = useAvatarCrop({
        initialAvatar: user?.user_metadata?.avatar_url || user?.user_metadata?.avatar_data,
    })

    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    if (!isOpen) return null

    const onSubmit = async (data: ProfileEditFormValues) => {
        setError(null)
        setSuccess(null)

        try {
            let croppedAvatar = imageSrc
            if (imageSrc && imageSrc.startsWith('data:image')) {
                croppedAvatar = await cropImage()
            }

            const res = await updateProfileMetadata({
                avatar_data: croppedAvatar || undefined,
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone,
                telegram: data.telegram || undefined,
                main_sport: data.main_sport,
            })

            if (res?.error) {
                setError(res.error)
            } else {
                setSuccess('Профіль успішно оновлено!')
                router.refresh()
                setTimeout(() => {
                    onClose()
                    setSuccess(null)
                }, 1200)
            }
        } catch {
            setError('Виникла помилка при оновленні профілю')
        }
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <CloseIcon />
                </button>

                <h2 className={styles.modalTitle}>Заповнити профіль</h2>

                <form noValidate onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    {error && <div className={styles.errorAlert}>{error}</div>}
                    {success && <div className={styles.successAlert}>{success}</div>}

                    {/* Avatar Upload with Direct Drag and Touch Cropping */}
                    <div className={styles.avatarSection}>
                        <label className={styles.fieldLabel}>Аватар</label>
                        <div className={styles.avatarCropWrapper}>
                            <div
                                className={`${styles.avatarCircle} ${isDragging ? styles.grabbing : styles.grab}`}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUpOrLeave}
                                onMouseLeave={handleMouseUpOrLeave}
                                touch-action="none"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                onWheel={handleWheel}
                            >
                                {imageSrc ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={imageSrc}
                                        style={{
                                            transform: `translate(${xOffset}px, ${yOffset}px) scale(${zoom})`,
                                        }}
                                        className={styles.previewImage}
                                        alt="Avatar Preview"
                                        draggable="false"
                                    />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <div className={styles.cropHint}>
                                {imageSrc
                                    ? 'Перетягуйте для зсуву, крутіть коліщатко або щипайте екран для масштабу'
                                    : 'Оберіть файл нижче'}
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                className={styles.uploadBtn}
                                onClick={triggerFileSelect}
                            >
                                Оберіть фото
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className={styles.hiddenInput}
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <Input
                            label="Ім'я"
                            type="text"
                            placeholder="Олександр"
                            error={errors.first_name?.message}
                            required
                            {...register('first_name')}
                        />
                        <Input
                            label="Прізвище"
                            type="text"
                            placeholder="Коваленко"
                            error={errors.last_name?.message}
                            required
                            {...register('last_name')}
                        />
                    </div>

                    <Input
                        label="Мобільний телефон"
                        type="tel"
                        placeholder="+380991234567"
                        error={errors.phone?.message}
                        required
                        {...register('phone')}
                    />

                    <Input
                        label="Нікнейм у Telegram"
                        type="text"
                        placeholder="@username"
                        error={errors.telegram?.message}
                        {...register('telegram')}
                    />

                    <Select
                        label="Основний вид спорту"
                        error={errors.main_sport?.message}
                        required
                        {...register('main_sport')}
                    >
                        <option value="football">Футбол</option>
                        <option value="basketball">Баскетбол</option>
                        <option value="volleyball">Волейбол</option>
                        <option value="tennis">Теніс</option>
                        <option value="other">Інше</option>
                    </Select>

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting}
                        className={styles.submitBtn}
                    >
                        {isSubmitting ? 'Збереження...' : 'Зберегти'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
