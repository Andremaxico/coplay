import React from 'react';
import Link from 'next/link';
import styles from './NoGames.module.scss';
import buttonStyles from '../Button/Button.module.scss';

interface NoGamesProps {
  title?: string;
  message?: string;
  showCreateButton?: boolean;
}

export function NoGames({
  title = 'Ігор не знайдено',
  message = 'Зараз немає запланованих ігор. Створіть власну гру, щоб знайти партнерів, або спробуйте змінити фільтри пошуку.',
  showCreateButton = true,
}: NoGamesProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <svg
            className={styles.icon}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Controller outline icon */}
            <line x1="6" y1="12" x2="10" y2="12" />
            <line x1="8" y1="10" x2="8" y2="14" />
            <line x1="15" y1="13" x2="15.01" y2="13" />
            <line x1="18" y1="11" x2="18.01" y2="11" />
            <path d="M18.32 18.32a10 10 0 0 1-12.64 0A6 6 0 0 1 2 12a6 6 0 0 1 3.68-5.68 10 10 0 0 1 12.64 0A6 6 0 0 1 22 12a6 6 0 0 1-3.68 5.68z" />
          </svg>
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        {showCreateButton && (
          <Link
            href="/games/new"
            className={`${buttonStyles.btn} ${buttonStyles.primary} ${styles.button}`}
          >
            Створити гру
          </Link>
        )}
      </div>
    </div>
  );
}
