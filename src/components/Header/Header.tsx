import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CoPlayLogo } from '@/UI/CoPlayLogo/CoPlayLogo'
import styles from './Header.module.scss'
import { HeaderProfile } from './HeaderProfile/HeaderProfile'
import { HeaderNav } from './HeaderNav/HeaderNav'

export const Header = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoWrapper}>
        <CoPlayLogo />
      </Link>

      <div className={styles.rightSection}>
        <HeaderNav />
        <HeaderProfile user={user} />
      </div>
    </header>
  )
}
