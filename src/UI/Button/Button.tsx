import React from 'react';
import styles from './Button.module.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  const buttonClass = `${styles.btn} ${styles[variant]} ${className || ''}`;
  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
}
