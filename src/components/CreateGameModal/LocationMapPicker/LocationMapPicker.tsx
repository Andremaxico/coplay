'use client'

import React from 'react'
import { SearchIcon, CrosshairIcon, CheckIcon, LocationIcon } from '@/UI/Icons/Icons'
import { Button } from '@/UI/Button/Button'
import { useLocationMap } from '@/app/hooks'
import styles from './LocationMapPicker.module.scss'

type PropsType = {
    initialLocation?: string
    onSelectLocation: (locationText: string) => void
    onClose?: () => void
}

export const LocationMapPicker: React.FC<PropsType> = ({
    initialLocation,
    onSelectLocation,
    onClose,
}) => {
    const {
        mapContainerRef,
        isLoadingMap,
        loadError,
        searchQuery,
        setSearchQuery,
        isSearching,
        isGeocoding,
        currentAddress,
        handleSearch,
        handleLocateMe,
    } = useLocationMap({ initialLocation })

    const handleConfirm = () => {
        if (currentAddress.trim()) {
            onSelectLocation(currentAddress.trim())
            if (onClose) onClose()
        }
    }

    return (
        <div className={styles.container}>
            {/* Search Bar */}
            <div className={styles.searchBar}>
                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                e.stopPropagation()
                                handleSearch()
                            }
                        }}
                        placeholder="Пошук вулиці, парку або стадіону..."
                        className={styles.searchInput}
                    />
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={isSearching}
                        className={styles.searchBtn}
                        title="Знайти"
                    >
                        <SearchIcon />
                    </button>
                </div>
                <button
                    type="button"
                    onClick={handleLocateMe}
                    className={styles.locateBtn}
                    title="Моє місцезнаходження"
                >
                    <CrosshairIcon />
                </button>
            </div>

            {/* Map Canvas */}
            <div className={styles.mapWrapper}>
                <div ref={mapContainerRef} className={styles.mapCanvas} />

                {isLoadingMap && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner} />
                        <span>Завантаження Google Maps...</span>
                    </div>
                )}

                {loadError && (
                    <div className={styles.errorOverlay}>
                        <p>{loadError}</p>
                    </div>
                )}
            </div>

            {/* Hint & Address Display */}
            <div className={styles.footer}>
                <div className={styles.addressInfo}>
                    <LocationIcon />
                    <span className={styles.addressText}>
                        {isGeocoding
                            ? 'Визначаємо адресу...'
                            : currentAddress || 'Клікніть на карті для вибору локації'}
                    </span>
                </div>

                <div className={styles.actions}>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.cancelBtn}
                        >
                            Закрити
                        </button>
                    )}
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={!currentAddress.trim() || isGeocoding}
                        className={styles.confirmBtn}
                    >
                        <CheckIcon />
                        <span>Обрати це місце</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
