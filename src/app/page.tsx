import { Games } from '@/components/Games/Games'
import styles from './page.module.scss'

export default async function HomePage() {
  return (
    <main className={styles.main}>
      <Games />
    </main>
  )
}