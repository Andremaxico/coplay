'use client'

import React, { useState, forwardRef } from 'react';
import styles from './Input.module.scss';
import { getUkrainianErrorMessage } from '@/utils/validation';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error: externalError, helperText, className, containerClassName, onInvalid, onBlur, onChange, ...props }, ref) => {
    const [internalError, setInternalError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const displayError = externalError !== undefined ? externalError : (touched ? internalError : null);

    const handleInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
      e.preventDefault(); // Disable default browser validation popup!
      const msg = getUkrainianErrorMessage(e.currentTarget, externalError);
      setInternalError(msg);
      setTouched(true);
      if (onInvalid) {
        onInvalid(e);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      const msg = getUkrainianErrorMessage(e.currentTarget, externalError);
      setInternalError(msg);
      if (onBlur) {
        onBlur(e);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (touched) {
        const msg = getUkrainianErrorMessage(e.currentTarget, externalError);
        setInternalError(msg);
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className={`${styles.field} ${containerClassName || ''}`}>
        {label && <label className={styles.label}>{label}</label>}
        <input
          ref={ref}
          className={`${styles.input} ${displayError ? styles.hasError : ''} ${className || ''}`}
          onInvalid={handleInvalid}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        {displayError ? (
          <span className={styles.errorMessage}>
            <svg
              className={styles.errorIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {displayError}
          </span>
        ) : helperText ? (
          <span className={styles.helperText}>{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
