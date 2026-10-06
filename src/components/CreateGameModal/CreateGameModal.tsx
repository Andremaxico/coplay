'use client'

import React from 'react'
import { CloseIcon } from '@/UI/Icons/Icons'
import { CreateGameForm } from './CreateGameForm/CreateGameForm'
import styles from './CreateGameModal.module.scss'

type PropsType = {
    isOpen: boolean
    onClose: () => void
}

export const CreateGameModal: React.FC<PropsType> = ({ isOpen, onClose }) => {
    if (!isOpen) return null

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button
                    className={styles.closeBtn}
                    onClick={onClose}
                    type="button"
                    title="Закрити"
                >
                    <CloseIcon />
                </button>

                <h2 className={styles.modalTitle}>Створити гру</h2>

                <CreateGameForm onSuccess={onClose} onCancel={onClose} />
            </div>
        </div>
    )
}
