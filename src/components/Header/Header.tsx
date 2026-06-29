import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CoPlayLogo } from '@/UI/CoPlayLogo/CoPlayLogo'
import { AuthButtons } from './AuthButtons/AuthButtons'
import styles from './Header.module.scss'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoWrapper}>
        <CoPlayLogo />
      </Link>
      
      <div className={styles.accountWrapper}>
        <AuthButtons user={user} />
      </div>
    </header>
  )
}
