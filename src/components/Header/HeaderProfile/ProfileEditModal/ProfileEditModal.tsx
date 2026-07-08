'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileMetadata } from '@/app/actions/auth'
import { SportType, UserType } from '@/app/types'
import { Button } from '@/UI/Button/Button'
import { Input } from '@/UI/Input/Input'
import { Select } from '@/UI/Select/Select'
import { CloseIcon } from '@/UI/Icons/Icons'
import styles from './ProfileEditModal.module.scss'

type PropsType = {
    user: UserType | null
    isOpen: boolean
    onClose: () => void
}

export const ProfileEditModal: React.FC<PropsType> = ({ user, isOpen, onClose }) => {
    const router = useRouter()
    
    // Form fields initialized directly from user prop
    const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '')
    const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '')
    const [phone, setPhone] = useState(user?.user_metadata?.phone || '')
    const [telegram, setTelegram] = useState(user?.user_metadata?.telegram || '')
    const [mainSport, setMainSport] = useState<SportType>((user?.user_metadata?.main_sport as SportType) || 'football')
    
    // Image cropping states
    const [imageSrc, setImageSrc] = useState<string | null>(user?.user_metadata?.avatar_url || user?.user_metadata?.avatar_data || null)
    const [zoom, setZoom] = useState(1)
    const [xOffset, setXOffset] = useState(0)
    const [yOffset, setYOffset] = useState(0)
    
    // Interactive drag and touch state
    const [isDragging, setIsDragging] = useState(false)
    const dragStart = useRef({ x: 0, y: 0 })
    const offsetStart = useRef({ x: 0, y: 0 })
    const lastTouchDistance = useRef<number | null>(null)
    
    // Status
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = () => {
                setImageSrc(reader.result as string)
                setZoom(1)
                setXOffset(0)
                setYOffset(0)
            }
            reader.readAsDataURL(file)
        }
    }

    const triggerFileSelect = () => {
        fileInputRef.current?.click()
    }

    // Touch handlers for mobile devices
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2) {
            setIsDragging(false)
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            lastTouchDistance.current = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
        } else if (e.touches.length === 1) {
            setIsDragging(true)
            dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
            offsetStart.current = { x: xOffset, y: yOffset }
        }
    }

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2) {
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
            
            if (lastTouchDistance.current !== null) {
                const delta = dist - lastTouchDistance.current
                const zoomFactor = delta * 0.015
                setZoom(prev => Math.max(1, Math.min(5, prev + zoomFactor)))
            }
            lastTouchDistance.current = dist
        } else if (e.touches.length === 1 && isDragging) {
            const clientX = e.touches[0].clientX
            const clientY = e.touches[0].clientY
            const dx = clientX - dragStart.current.x
            const dy = clientY - dragStart.current.y
            setXOffset(offsetStart.current.x + dx)
            setYOffset(offsetStart.current.y + dy)
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
        lastTouchDistance.current = null
    }

    // Mouse handlers for desktop browser drag-to-move
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
        dragStart.current = { x: e.clientX, y: e.clientY }
        offsetStart.current = { x: xOffset, y: yOffset }
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return
        const dx = e.clientX - dragStart.current.x
        const dy = e.clientY - dragStart.current.y
        setXOffset(offsetStart.current.x + dx)
        setYOffset(offsetStart.current.y + dy)
    }

    const handleMouseUpOrLeave = () => {
        setIsDragging(false)
    }

    // Mouse wheel handler to zoom
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        const zoomStep = 0.08
        const direction = e.deltaY < 0 ? 1 : -1
        setZoom(prev => Math.max(1, Math.min(5, prev + direction * zoomStep)))
    }

    const cropImage = (): Promise<string> => {
        return new Promise((resolve) => {
            if (!imageSrc) return resolve('')

            const canvas = document.createElement('canvas')
            canvas.width = 150
            canvas.height = 150
            const ctx = canvas.getContext('2d')
            if (!ctx) return resolve('')

            const img = new Image()
            img.src = imageSrc
            img.onload = () => {
                ctx.clearRect(0, 0, 150, 150)
                
                // Circular clip
                ctx.beginPath()
                ctx.arc(75, 75, 75, 0, Math.PI * 2)
                ctx.clip()
                
                const drawWidth = 150 * zoom
                const drawHeight = (img.height / img.width) * drawWidth
                
                const dx = 75 - drawWidth / 2 + xOffset
                const dy = 75 - drawHeight / 2 + yOffset
                
                ctx.drawImage(img, dx, dy, drawWidth, drawHeight)
                resolve(canvas.toDataURL('image/jpeg', 0.5))
            }
            img.onerror = () => {
                resolve(imageSrc)
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)
        setLoading(true)

        try {
            let croppedAvatar = imageSrc
            if (imageSrc && imageSrc.startsWith('data:image')) {
                croppedAvatar = await cropImage()
            }

            const res = await updateProfileMetadata({
                avatar_data: croppedAvatar || undefined,
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                telegram: telegram || undefined,
                main_sport: mainSport
            })

            if (res?.error) {
                setError(res.error)
            } else {
                setSuccess('Профіль успішно оновлено!')
                router.refresh()
                setTimeout(() => {
                    onClose()
                    setSuccess(null)
                }, 1500)
            }
        } catch {
            setError('Виникла помилка при оновленні профілю')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <CloseIcon />
                </button>

                <h2 className={styles.modalTitle}>Заповнити профіль</h2>

                <form onSubmit={handleSubmit} className={styles.form}>
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
                                {imageSrc ? 'Перетягуйте для зсуву, крутіть коліщатко або щипайте екран для масштабу' : 'Оберіть файл нижче'}
                            </div>

                            <Button type="button" variant="ghost" className={styles.uploadBtn} onClick={triggerFileSelect}>
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
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Олександр"
                            required
                        />
                        <Input
                            label="Прізвище"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Коваленко"
                            required
                        />
                    </div>

                    <Input
                        label="Мобільний телефон"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+380991234567"
                        required
                    />

                    <Input
                        label="Нікнейм у Telegram"
                        type="text"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                        placeholder="@username"
                    />

                    <Select
                        label="Основний вид спорту"
                        value={mainSport}
                        onChange={(e) => setMainSport(e.target.value as SportType)}
                        required
                    >
                        <option value="football">Футбол</option>
                        <option value="basketball">Баскетбол</option>
                        <option value="volleyball">Волейбол</option>
                        <option value="tennis">Теніс</option>
                        <option value="other">Інше</option>
                    </Select>

                    <Button type="submit" variant="primary" disabled={loading} className={styles.submitBtn}>
                        {loading ? 'Збереження...' : 'Зберегти'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
