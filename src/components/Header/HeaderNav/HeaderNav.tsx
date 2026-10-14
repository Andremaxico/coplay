'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './HeaderNav.module.scss'

export const HeaderNav = () => {
    const pathname = usePathname()

    const navItems = [
        { href: '/my-games', label: 'Мої Ігри' }
    ]

    return (
        <nav className={styles.nav}>
            <ul className={styles.navList}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <li key={item.href} className={styles.navItem}>
                            <Link
                                href={item.href}
                                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                            >
                                {item.label}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
