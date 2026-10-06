import styles from './GamesList.module.scss'
import { getGames } from '@/app/actions/games'
import { NoGames } from '@/UI/NoGames/NoGames'
import { ErrorMessage } from '@/UI/ErrorMessage/ErrorMessage'
import { GameCard } from '@/UI/GameCard/GameCard'

export const GamesList = async () => {

    const gamesData = await getGames();

    if (!Array.isArray(gamesData)) return <ErrorMessage />;

    if (gamesData.length == 0) return <NoGames />

    return (
        <div className={styles.GamesList}>
            {gamesData.map((game) => (
                <GameCard key={game.id} game={game} />
            ))}
        </div>
    )
}
