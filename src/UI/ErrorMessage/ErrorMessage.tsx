'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './ErrorMessage.module.scss';
import { Button } from '../Button/Button';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  showRetry?: boolean;
}

export function ErrorMessage({
  title = 'Щось пішло не так',
  message = 'Не вдалося завантажити дані. Будь ласка, перевірте підключення до інтернету або спробуйте пізніше.',
  onRetry,
  retryText = 'Спробувати знову',
  showRetry = true,
}: ErrorMessageProps) {
  const router = useRouter();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      router.refresh();
    }
  };

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
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        {showRetry && (
          <Button variant="secondary" onClick={handleRetry} className={styles.button}>
            {retryText}
          </Button>
        )}
      </div>
    </div>
  );
}
