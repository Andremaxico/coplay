import React from 'react';
import styles from './Button.module.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className, children, ...props }) => {
  const buttonClass = `${styles.btn} ${styles[variant]} ${className || ''}`;
  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};
