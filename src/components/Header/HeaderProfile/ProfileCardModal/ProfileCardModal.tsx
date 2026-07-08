'use client'

import React from 'react'
import { signOut } from '@/app/actions/auth'
import { ProfileIcon } from '@/UI/Icons/Icons'
import { UserType } from '@/app/types'
import styles from './ProfileCardModal.module.scss'

type PropsType = {
    user: UserType | null
    onEditClick: () => void
}

export const ProfileCardModal: React.FC<PropsType> = ({ user, onEditClick }) => {
    const getSportName = (sportCode?: string) => {
        switch (sportCode) {
            case 'football': return 'Футбол'
            case 'basketball': return 'Баскетбол'
            case 'volleyball': return 'Волейбол'
            case 'tennis': return 'Теніс'
            case 'other': return 'Інше'
            default: return 'Не вказано'
        }
    }

    const avatarSrc = user?.user_metadata?.avatar_url || user?.user_metadata?.avatar_data || null

    return (
        <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
                <div className={styles.cardAvatarCircle}>
                    {avatarSrc ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={avatarSrc}
                            className={styles.cardAvatar}
                            alt="Avatar"
                        />
                    ) : (
                        <ProfileIcon />
                    )}
                </div>
                <div className={styles.cardUserInfo}>
                    <div className={styles.cardUserName}>
                        {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                    </div>
                    <div className={styles.cardUserEmail}>
                        {user?.email}
                    </div>
                </div>
            </div>

            <div className={styles.cardDetails}>
                <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Спорт:</span>
                    <span className={styles.detailValue}>
                        {getSportName(user?.user_metadata?.main_sport)}
                    </span>
                </div>
                <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Телефон:</span>
                    <span className={styles.detailValue}>
                        {user?.user_metadata?.phone}
                    </span>
                </div>
                {user?.user_metadata?.telegram && (
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Telegram:</span>
                        <span className={styles.detailValue}>
                            {user.user_metadata.telegram}
                        </span>
                    </div>
                )}
            </div>

            <div className={styles.cardActions}>
                <button
                    onClick={onEditClick}
                    className={styles.editBtn}
                >
                    Редагувати
                </button>
                <form action={signOut} className={styles.logoutForm}>
                    <button type="submit" className={styles.logoutBtn}>
                        Вийти
                    </button>
                </form>
            </div>
        </div>
    )
}
