'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LoginIcon, ProfileIcon } from '@/UI/Icons/Icons'
import { LoginPopup } from '../../LoginPopup/LoginPopup'
import { ProfileEditModal } from './ProfileEditModal/ProfileEditModal'
import { ProfileCardModal } from './ProfileCardModal/ProfileCardModal'
import { CreateGameModal } from './CreateGameModal/CreateGameModal'
import { UserType } from '@/app/types'
import styles from './HeaderProfile.module.scss'

type PropsType = {
    user: UserType | null
}

export type ModeType = 'closed' | 'login' | 'register'

export const HeaderProfile: React.FC<PropsType> = ({ user }) => {
    const [mode, setMode] = useState<ModeType>('closed')
    const [isProfileEditOpen, setIsProfileEditOpen] = useState(false)
    const [isCreateGameOpen, setIsCreateGameOpen] = useState(false)

    const isProfileFilled = !!(
        user?.user_metadata?.first_name &&
        user?.user_metadata?.last_name &&
        user?.user_metadata?.phone &&
        user?.user_metadata?.main_sport
    )

    if (user) {
        return (
            <div className={styles.container}>
                <button
                    className={styles.createGameButton}
                    onClick={() => setIsCreateGameOpen(true)}
                >
                    Створити гру
                </button>
                <div className={styles.profileWrapper}>
                    <Link href="#" className={styles.profileLink} title="Мій акаунт">
                        {user?.user_metadata?.avatar_data || user?.user_metadata?.avatar_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={user.user_metadata.avatar_url || user.user_metadata.avatar_data}
                                className={styles.avatarImage}
                                alt="Avatar"
                            />
                        ) : (
                            <ProfileIcon />
                        )}
                    </Link>
                    <div className={styles.profileDropdown}>
                        {isProfileFilled ? (
                            <ProfileCardModal
                                user={user}
                                onEditClick={() => setIsProfileEditOpen(true)}
                            />
                        ) : (
                            <div className={styles.unfilledWarning}>
                                <p className={styles.warningText}>
                                    Будь ласка, заповніть свій профіль, щоб користуватися всіма функціями сайту.
                                </p>
                                <button
                                    onClick={() => setIsProfileEditOpen(true)}
                                    className={styles.dropdownItem}
                                >
                                    Заповнити профіль
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* key is needed for full re-rendering after open/close  */}
                <ProfileEditModal
                    key={isProfileEditOpen ? 'profile-edit-open' : 'profile-edit-closed'}
                    user={user}
                    isOpen={isProfileEditOpen}
                    onClose={() => setIsProfileEditOpen(false)}
                />

                {/* key is needed for full re-rendering after open/close */}
                <CreateGameModal
                    key={isCreateGameOpen ? 'create-game-open' : 'create-game-closed'}
                    isOpen={isCreateGameOpen}
                    onClose={() => setIsCreateGameOpen(false)}
                />
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <button
                className={styles.createGameButton}
                onClick={() => setMode('login')}
            >
                Створити гру
            </button>
            <button
                onClick={() => setMode('login')}
                className={styles.iconBtn}
                title="Увійти"
            >
                <LoginIcon />
            </button>

            {mode !== 'closed' && (
                <LoginPopup
                    mode={mode}
                    setMode={setMode}
                    onClose={() => setMode('closed')}
                />
            )}
        </div>
    )
}
