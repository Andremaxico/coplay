'use client'

import React from 'react'
import { createClient } from '@/lib/supabase/client'
import { useModalStore } from '@/store/useModalStore'
import styles from './AddGameButton.module.scss'

export const AddGameButton: React.FC = () => {
    const openCreateGame = useModalStore((state) => state.openCreateGame)
    const openLogin = useModalStore((state) => state.openLogin)

    const handleClick = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            openCreateGame()
        } else {
            openLogin()
        }
    }

    return (
        <div className={styles.wrapper}>
            <button
                type="button"
                className={styles.button}
                onClick={handleClick}
                title="Створити гру"
                aria-label="Створити гру"
            >
                <svg
                    className={styles.icon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>
        </div>
    )
}
