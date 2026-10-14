'use client'

import React, { useRef, useState, useEffect } from 'react'
import styles from './MyGamesTabs.module.scss'

type PropsType = {
    setActiveTab: (tab: 'upcoming' | 'past') => void;
    activeTab: 'upcoming' | 'past';
    upcomingCount: number;
    pastCount: number;
}

export const MyGamesTabs: React.FC<PropsType> = ({ setActiveTab, activeTab, upcomingCount, pastCount }) => {
    const upcomingBtnRef = useRef<HTMLButtonElement>(null)
    const pastBtnRef = useRef<HTMLButtonElement>(null)

    const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
        left: 0,
        width: 0,
    })

    useEffect(() => {
        const updateIndicator = () => {
            const activeBtn = activeTab === 'upcoming' ? upcomingBtnRef.current : pastBtnRef.current
            if (activeBtn) {
                setIndicatorStyle({
                    left: activeBtn.offsetLeft,
                    width: activeBtn.offsetWidth,
                })
            }
        }

        updateIndicator()
        if (typeof document !== 'undefined' && document.fonts?.ready) {
            document.fonts.ready.then(updateIndicator)
        }
        window.addEventListener('resize', updateIndicator)
        return () => window.removeEventListener('resize', updateIndicator)
    }, [activeTab, upcomingCount, pastCount])

    return (
        <div className={styles.mainTabs}>
            <button
                ref={upcomingBtnRef}
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'upcoming' ? styles.active : ''}`}
                onClick={() => setActiveTab('upcoming')}
            >
                Майбутні ігри <span className={styles.badge}>{upcomingCount}</span>
            </button>
            <button
                ref={pastBtnRef}
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'past' ? styles.active : ''}`}
                onClick={() => setActiveTab('past')}
            >
                Історія ігор <span className={styles.badge}>{pastCount}</span>
            </button>
            <span
                className={styles.indicator}
                style={{
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                    opacity: indicatorStyle.width > 0 ? 1 : 0,
                }}
            />
        </div>
    )
}