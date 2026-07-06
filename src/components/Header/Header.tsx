import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CoPlayLogo } from '@/UI/CoPlayLogo/CoPlayLogo'
import styles from './Header.module.scss'
import { HeaderProfile } from './HeaderProfile/HeaderProfile'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoWrapper}>
        <CoPlayLogo />
      </Link>

      <div className={styles.accountWrapper}>
        <HeaderProfile user={user} />
      </div>
    </header>
  )
}
