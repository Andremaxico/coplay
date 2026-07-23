'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ModeType } from '../Header/HeaderProfile/HeaderProfile'
import { loginWithEmail, signUpWithEmail, signInWithGoogle } from '@/app/actions/auth'
import { Button } from '@/UI/Button/Button'
import { Input } from '@/UI/Input/Input'
import { CloseIcon, GoogleIcon } from '@/UI/Icons/Icons'
import styles from './LoginPopup.module.scss'

type PropsType = {
    mode: ModeType
    setMode: (mode: ModeType) => void
    onClose: () => void
}

export const LoginPopup: React.FC<PropsType> = ({ mode, setMode, onClose }) => {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleClose = () => {
        setError(null)
        setSuccess(null)
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        onClose()
    }

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const res = await loginWithEmail(email, password)
            if (res?.error) {
                setError(res.error)
            } else {
                handleClose()
                router.refresh()
            }
        } catch {
            setError('Виникла непередбачена помилка')
        } finally {
            setLoading(false)
        }
    }

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (password !== confirmPassword) {
            setError('Паролі не співпадають')
            return
        }

        setLoading(true)
        try {
            const res = await signUpWithEmail(email, password)
            if (res?.error) {
                setError(res.error)
            } else {
                setSuccess('Реєстрація успішна! Увійдіть у створений акаунт.')
                setEmail('')
                setPassword('')
                setConfirmPassword('')

                // Automatically switch to login screen after 2.5 seconds
                setTimeout(() => {
                    setMode('login')
                    setSuccess(null)
                }, 2500)
            }
        } catch {
            setError('Виникла непередбачена помилка')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={handleClose}>
                    <CloseIcon />
                </button>

                {mode === 'login' ? (
                    <div className={styles.modalFormWrapper}>
                        <h2 className={styles.modalTitle}>Вхід</h2>
                        <form noValidate onSubmit={handleLoginSubmit} className={styles.form}>
                            {error && <div className={styles.errorAlert}>{error}</div>}

                            <Input
                                label="Електронна пошта"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="your@email.com"
                            />

                            <Input
                                label="Пароль"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />

                            <Button type="submit" variant="primary" disabled={loading} className={styles.submitBtn}>
                                {loading ? 'Вхід...' : 'Увійти'}
                            </Button>

                            <div className={styles.divider}>
                                <span>або</span>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => signInWithGoogle()}
                                className={styles.googleBtn}
                            >
                                <GoogleIcon />
                                Увійти через Google
                            </Button>
                        </form>
                        <div className={styles.switchMode}>
                            Немає акаунту?
                            <button
                                onClick={() => {
                                    setMode('register')
                                    setError(null)
                                }}
                                className={styles.switchBtn}
                            >
                                Реєстрація
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.modalFormWrapper}>
                        <h2 className={styles.modalTitle}>Реєстрація</h2>
                        <form noValidate onSubmit={handleRegisterSubmit} className={styles.form}>
                            {error && <div className={styles.errorAlert}>{error}</div>}
                            {success && <div className={styles.successAlert}>{success}</div>}

                            <Input
                                label="Електронна пошта"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="your@email.com"
                            />

                            <Input
                                label="Пароль"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />

                            <Input
                                label="Підтвердіть пароль"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />

                            <Button type="submit" variant="secondary" disabled={loading} className={styles.submitBtn}>
                                {loading ? 'Реєстрація...' : 'Зареєструватися'}
                            </Button>
                        </form>
                        <div className={styles.switchMode}>
                            Вже є акаунт?
                            <button
                                onClick={() => {
                                    setMode('login')
                                    setError(null)
                                    setSuccess(null)
                                }}
                                className={styles.switchBtn}
                            >
                                Увійти
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
