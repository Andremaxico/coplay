'use client'

import React, { useState, forwardRef } from 'react';
import styles from './Select.module.scss';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error: externalError, helperText, className, containerClassName, children, onInvalid, onBlur, onChange, ...props }, ref) => {
    const [internalError, setInternalError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const displayError = externalError !== undefined ? externalError : (touched ? internalError : null);

    const handleInvalid = (e: React.InvalidEvent<HTMLSelectElement>) => {
      e.preventDefault(); // Suppress browser native popup
      if (e.currentTarget.validity.valueMissing) {
        setInternalError("Це поле є обов'язковим для заповнення");
      } else {
        setInternalError('Оберіть значення зі списку');
      }
      setTouched(true);
      if (onInvalid) onInvalid(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setTouched(true);
      if (props.required && !e.currentTarget.value) {
        setInternalError("Це поле є обов'язковим для заповнення");
      } else {
        setInternalError(null);
      }
      if (onBlur) onBlur(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (touched) {
        if (props.required && !e.currentTarget.value) {
          setInternalError("Це поле є обов'язковим для заповнення");
        } else {
          setInternalError(null);
        }
      }
      if (onChange) onChange(e);
    };

    return (
      <div className={`${styles.field} ${containerClassName || ''}`}>
        {label && <label className={styles.label}>{label}</label>}
        <select
          ref={ref}
          className={`${styles.select} ${displayError ? styles.hasError : ''} ${className || ''}`}
          onInvalid={handleInvalid}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        >
          {children}
        </select>
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

Select.displayName = 'Select';
