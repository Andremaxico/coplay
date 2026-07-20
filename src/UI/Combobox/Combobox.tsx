'use client'

import React, { useState, useEffect, useRef } from 'react'
import styles from './Combobox.module.scss'

export interface ComboboxOption {
    value: string
    label: string
}

interface ComboboxProps {
    label?: string
    value: string | undefined
    onChange: (value: string | undefined) => void
    options: ComboboxOption[]
    placeholder?: string
    required?: boolean
    className?: string
}

export function Combobox({
    label,
    value,
    onChange,
    options,
    placeholder,
    required = false,
    className = ''
}: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState(() => {
        const option = options.find(opt => opt.value === value)
        return option ? option.label : value
    })
    const [focusedIndex, setFocusedIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const [prevValue, setPrevValue] = useState(value)
    if (value !== prevValue) {
        setPrevValue(value)
        const option = options.find(opt => opt.value === value)
        setSearchTerm(option ? option.label : value)
    }

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                // If closed and current typed search term doesn't match the selected value,
                // sync the value to what is currently typed (since custom input is allowed)
                const matchedOption = options.find(opt => opt.label.toLowerCase() === searchTerm?.toLowerCase())
                if (matchedOption) {
                    onChange(matchedOption.value)
                } else {
                    onChange(searchTerm)
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [searchTerm, options, onChange])

    // Filter options based on typed input
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
        option.value.toLowerCase().includes(searchTerm?.toLowerCase() || '')
    )

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value
        setSearchTerm(term)
        setIsOpen(true)
        setFocusedIndex(-1)

        // Propagate custom value immediately or let blur handle it. 
        // Propagating immediately makes dynamic title suggestions feel responsive!
        const matchedOption = options.find(opt => opt.label.toLowerCase() === term.toLowerCase())
        if (matchedOption) {
            onChange(matchedOption.value)
        } else {
            onChange(term)
        }
    }

    const selectOption = (option: ComboboxOption) => {
        onChange(option.value)
        setSearchTerm(option.label)
        setIsOpen(false)
        setFocusedIndex(-1)
        inputRef.current?.blur()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setIsOpen(true)
            setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setIsOpen(true)
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1))
        } else if (e.key === 'Enter') {
            if (isOpen && focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
                e.preventDefault()
                selectOption(filteredOptions[focusedIndex])
            } else {
                setIsOpen(false)
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false)
            setFocusedIndex(-1)
            inputRef.current?.blur()
        }
    }

    return (
        <div className={`${styles.field} ${className}`} ref={containerRef}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.inputWrapper}>
                <input
                    ref={inputRef}
                    type="text"
                    className={styles.input}
                    value={searchTerm || ''}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    required={required}
                    onKeyDown={handleKeyDown}
                />
                <button
                    type="button"
                    className={`${styles.arrowBtn} ${isOpen ? styles.open : ''}`}
                    onClick={() => {
                        setIsOpen(!isOpen)
                        if (!isOpen) inputRef.current?.focus()
                    }}
                    tabIndex={-1}
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>

                {isOpen && (
                    <ul className={styles.dropdown}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => {
                                const isSelected = option.value === value
                                const isFocused = index === focusedIndex
                                return (
                                    <li
                                        key={option.value}
                                        className={`${styles.option} ${isSelected ? styles.selected : ''} ${isFocused ? styles.focused : ''}`}
                                        onClick={() => selectOption(option)}
                                    >
                                        {option.label}
                                    </li>
                                )
                            })
                        ) : (
                            // If no matching options, and we are not searching, show a placeholder or let them enter custom
                            searchTerm?.trim() !== '' ? (
                                <li
                                    className={`${styles.option} ${styles.customVal}`}
                                    onClick={() => {
                                        onChange(searchTerm)
                                        setIsOpen(false)
                                    }}
                                >
                                    Створити нове: &quot;{searchTerm}&quot;
                                </li>
                            ) : (
                                <li className={styles.noOptions}>Немає варіантів</li>
                            )
                        )}
                    </ul>
                )}
            </div>
        </div>
    )
}
