'use client'

import { signInWithGoogle, signOut } from '@/app/auth/actions'
import { Button } from '@/UI/Button/Button'
import styles from './AuthButtons.module.scss'

interface Props {
    user: { email?: string | null } | null
}

export function AuthButtons({ user }: Props) {
    if (user) {
        return (
            <div className={styles.container}>
                <span className={styles.email}>{user.email}</span>
                <form action={signOut}>
                    <Button 
                        type="submit"
                        variant="danger"
                    >
                        Вийти
                    </Button>
                </form>
            </div>
        )
    }

    return (
        <form action={signInWithGoogle}>
            <Button 
                type="submit"
                variant="primary"
            >
                Увійти через Google
            </Button>
        </form>
    )
}
