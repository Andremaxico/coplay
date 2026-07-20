import styles from './GamesList.module.scss'
import { getGames } from '@/app/actions/games'
import { GamesCard } from './GamesCard/GamesCard'
import { NoGames } from '@/UI/NoGames/NoGames'
import { ErrorMessage } from '@/UI/ErrorMessage/ErrorMessage'

export const GamesList = async () => {

    const gamesData = await getGames();

    if (!Array.isArray(gamesData)) return <ErrorMessage />;

    if (gamesData.length == 0) return <NoGames />

    return (
        <div className={styles.GamesList}>
            <div className={styles.grid}>
                {gamesData.map((game) => (
                    <GamesCard key={game.id} game={game} />
                ))}
            </div>
        </div>
    )
}
