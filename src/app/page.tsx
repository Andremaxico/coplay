import { createClient } from '@/lib/supabase/server'
import { AuthButtons } from '@/components/Header/AuthButtons/AuthButtons'
import styles from './page.module.scss'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>CoPlay</h1>
      <p className={styles.subtitle}>
        Спільний простір для взаємодії та співпраці в реальному часі.
      </p>
      <div className={styles.authWrapper}>
        <AuthButtons user={user} />
      </div>
    </main>
  )
}